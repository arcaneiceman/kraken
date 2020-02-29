import CryptoJS from './Crypto/crypto-js'
import KaitaiStream from 'kaitai-struct/KaitaiStream'
import Hccapx from './WPA/HccapxFile'
import md4 from './Crypto/md4';

const crack = async (mode, valueToMatch, wordlist) => {
    if (wordlist.length === 0)
        throw Error("Wordlist error or empty")
    switch (mode) {
        case '2500':
            return await crackWPA(valueToMatch, wordlist)
        case '1000':
            return await crackNTML()
        case '0':
            return await crackMD5()
        default:
            throw new Error("Request Type Unknown : " + mode)
    }
}

const crackWPA = async (hccapxFile, wordlist) => {
    const hccapx = new Hccapx(new KaitaiStream(str2ab(hccapxFile)));
    if (hccapx.records.length === 0)
        throw Error("Hccapx Handshakes are empty")
    const result = {}
    for (let i = 0; i < hccapx.records.length; i++) { // Has to be for loop for async
        let essid = String.fromCharCode.apply(null, hccapx.records[i].essid)
        let srcAddress = buf2hex(hccapx.records[i].macAp)
        let dstAddress = buf2hex(hccapx.records[i].macStation)
        let anonce = buf2hex(hccapx.records[i].nonceAp)
        let snonce = buf2hex(hccapx.records[i].nonceStation)
        let prfPrefix = getPrfPrefix(srcAddress, dstAddress, anonce, snonce);
        let isWPA = (hccapx.records[i].keyver === 1)
        let eapolFrameBytes = buf2hex(hccapx.records[i].eapol)
        let mic = buf2hex(hccapx.records[i].keymic)

        for (let j = 0; j < wordlist.length; j++) {
            let computedPMK = await pmk(wordlist[j], essid);
            let computedKCK = kckFromPmk(computedPMK, prfPrefix)
            let computedMic = micFromKck(computedKCK, isWPA, eapolFrameBytes)
            if (computedMic === mic) {
                result[essid] = wordlist[j]
                break;
            }
        }
    }
    return result;
}

const crackNTML = async (valueList, wordlist) => {
    if (wordlist.length === 0)
        throw Error("Wordlist error or empty")
    const values = valueList.split("[\\s\n,|;:]+");
    if (values.length === 0)
        throw Error("Values are empty")
    const result = {}
    for (let i = 0; i<values.length; i++){
        for (let j=0; j<wordlist.length; j++){
            if (md4(wordlist[j].split("").join("\0") + "\0") === values[i]){
                result[values[i]] = wordlist[j]
                break;
            }
        }
    }
    return result;
}

const crackMD5 = async (valueList, wordlist) => {
    if (wordlist.length === 0)
        throw Error("Wordlist error or empty")
    const values = valueList.split("[\\s\n,|;:]+");
    if (values.length === 0)
        throw Error("Values are empty")
    const result = {}
    for (let i = 0; i<values.length; i++){
        for (let j=0; j<wordlist.length; j++){
            if (CryptoJS.MD5(wordlist[j]).toString() === values[i]){
                result[values[i]] = wordlist[j]
                break;
            }
        }
    }
    return result;
}

// Private Functions

const buf2hex = function (buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer),
        x => ('00' + x.toString(16)).slice(-2)).join('');
}

const str2ab = function (str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

const stringToHex = function (s) {
    var result = "", i, x;
    for (i = 0; i < s.length; i++) {
        x = s.charCodeAt(i).toString(16);
        while (x.length < 2) {
            x = "0" + x;
        }
        result += x;
    }
    return result;
};

const getPrfPrefix = function (srcAddress, dstAddress, snonce, anonce) {
    var prefix = "";
    prefix = stringToHex("Pairwise key expansion");
    prefix += "00";
    if (srcAddress < dstAddress) {
        prefix += srcAddress;
        prefix += dstAddress;
    } else {
        prefix += dstAddress;
        prefix += srcAddress;
    }
    if (snonce < anonce) {
        prefix += snonce;
        prefix += anonce;
    } else {
        prefix += anonce;
        prefix += snonce;
    }
    return prefix;
};

/**
 * Calculates Pairwise Master Key (PMK).
 * Uses PBKDF2 which may take a while...
 *
 * @param key (string) The plaintext key/password (PSK).
 * @param ssid (string, optional) SSID (name of Wireless Access Point). Uses SSID from CapFile if not given.
 * @return (CryptoJS-encoded object) The PMK (256bits/32Bytes).
 */
const pmk = async function (key, essid) {
    const importedKey = await crypto.subtle.importKey("raw", str2ab(key), { name: "PBKDF2" }, false, ["deriveKey", "deriveBits"]);
    const params = { name: "PBKDF2", hash: { name: "SHA-1" }, salt: str2ab(essid), iterations: 4096 };
    const derivation = await crypto.subtle.deriveBits(params, importedKey, 256);
    return buf2hex(derivation)
};

/**
 * Psudo-Random Function to calculate KCK (Key-Confirmation Key) from the PTK (Pairwise Transient Key).
 * Computes part of PTK using the given PMK.
 *
 * Uses "prfPrefix" calculated in Crack.getPrfPrefix().
 *
 * @param pmk (CryptoJS-encoded object) The PMK, calculated from Crack.pmk()
 * @return (string, hex) The KCK (first 16 bytes of the PTK).
 *
 */
const kckFromPmk = function (pmk, prfPrefix) {
    pmk = CryptoJS.enc.Hex.parse(pmk) // <- Added This Line to convert PMK from Hex to Words
    var i = 0, ptk = "", thisPrefix;
    while (i < (64 * 8 + 159) / 160) {
        thisPrefix = prfPrefix + ("0" + i);

        thisPrefix = CryptoJS.enc.Hex.parse(thisPrefix);
        ptk += CryptoJS.HmacSHA1(thisPrefix, pmk).toString();

        i++;
    }
    var kck = ptk.substring(0, 32);
    return kck;
};

/**
 * Calculate MIC using KCK (given) and EAPOL frame bytes (from a message in the 4-way handshake).
 *
 * @param kck (string, hex) The Key-ConfirmationKey (KCK) computed from Crack.kckFromPmk().
 * @return (string, hex) The expected MIC.
 */
const micFromKck = function (kck, isWPA, eapolFrameBytes) {
    kck = CryptoJS.enc.Hex.parse(kck);
    var bytes = CryptoJS.enc.Hex.parse(eapolFrameBytes);

    var computedMic;
    if (isWPA) {
        computedMic = CryptoJS.HmacMD5(bytes, kck).toString();
    }
    else {
        computedMic = CryptoJS.HmacSHA1(bytes, kck).toString();
        computedMic = computedMic.substring(0, 32);
    }
    return computedMic;
}

const FakeHashcat = {
    crack
}
export default FakeHashcat;