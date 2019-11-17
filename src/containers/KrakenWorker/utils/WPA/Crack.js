/* eslint-disable */

/**
 * Algorithm:
 *
 * Construct PMK using
 *  - passphrase (from user input or list) and
 *  - SSID (from user input or beacon frame).
 * pmk = pbkdf2_sha1(passphrase, ssid, 4096, 256)
 *
 * Construct PTK using
 *  - PMK (step 1)
 *  - AP bssid, STATION bssid, ANonce, SNonce (from Handshake 3 of 4)
 * ... (wpa_pmk_to_ptk)
 *
 * Construct MIC we expect to see in 4-of-4 using
 *  - PTK (Step 2)
 *  - EAPOL Frame (Handshake 4 of 4)
 */
import CryptoJS from '../Crypto/crypto-js'
import sjcl from '../Crypto/sjcl'
import KaitaiStream from 'kaitai-struct/KaitaiStream'
import Hccapx from '../../utils/WPA/HccapxFile'

export default function Crack(handshakeAsHccapx) {
    // Parse hccapx file
    this.hccapx = new Hccapx(new KaitaiStream(Crack.str2ab(handshakeAsHccapx)));
    if (this.hccapx.records.length === 0)
        throw Error("Did not find any handshakes")
    if (!this.hccapx.records.every((record) => String.fromCharCode.apply(null, record.essid) === String.fromCharCode.apply(null, this.hccapx.records[0].essid)))
        throw Error("ESSID do not match")
}

Crack.prototype.tryPSK = function (psk) {
    // Extract ESSID and generate PMK
    let pmk = Crack.pmk(psk, String.fromCharCode.apply(null, this.hccapx.records[0].essid));

    // For each Handshake
    for (let i = 0; i < this.hccapx.records.length; i++) {
        // Generate Prefix using Source Address, Desination Address and both nonces
        let srcAddress = Crack.buf2hex(this.hccapx.records[i].macAp)
        let dstAddress = Crack.buf2hex(this.hccapx.records[i].macStation)
        let anonce = Crack.buf2hex(this.hccapx.records[i].nonceAp)
        let snonce = Crack.buf2hex(this.hccapx.records[i].nonceStation)
        let prfPrefix = Crack.getPrfPrefix(srcAddress, dstAddress, anonce, snonce);
        
        // Get Whether this is WPA or WPA2
        let isWPA = (this.hccapx.records[0].keyver === 1)

        // Get EAPOL
        let eapolFrameBytes = Crack.buf2hex(this.hccapx.records[i].eapol)

         // Get MIC
        let mic = Crack.buf2hex(this.hccapx.records[i].keymic)

        // Generate KCK
        let kck = Crack.kckFromPmk(pmk, prfPrefix)

        // Generate Computed MIC
        let computedMic = Crack.micFromKck(kck, isWPA, eapolFrameBytes)

        if (computedMic === mic)
            return true
    }
    return false
};

Crack.str2ab = function (str) {
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

Crack.buf2hex = function (buffer) {
    return Array.prototype.map.call(new Uint8Array(buffer),
        x => ('00' + x.toString(16)).slice(-2)).join('');
}

Crack.stringToHex = function (s) {
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

/**
 * Compute prefix of one of the inputs to Pseudo-Random Function (PRF, see Crack.kckFromPmk).
 * The "prefix" contains the "Pairwise Key Expansion", addresses, and nonces.
 * @return (string, hex) PRF prefix.
 */
Crack.getPrfPrefix = function (srcAddress, dstAddress, snonce, anonce) {
    var prefix = "";
    prefix = Crack.stringToHex("Pairwise key expansion");
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
Crack.pmk = function (key, essid) {
    var hmacSHA1 = function (key) {
        var hasher = new sjcl.misc.hmac(key, sjcl.hash.sha1);
        this.encrypt = function () { return hasher.encrypt.apply(hasher, arguments); };
    };
    var pmk = sjcl.misc.pbkdf2(key, essid, 4096, 256, hmacSHA1)
    return pmk;
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
Crack.kckFromPmk = function (pmk, prfPrefix) {
    // Pseudo-Random function based on http://crypto.stackexchange.com/a/33192
    var i = 0, ptk = "", thisPrefix;
    while (i < (64 * 8 + 159) / 160) {
        // Append the current iteration counter as a (hex) byte to the prefix.
        thisPrefix = prfPrefix + ("0" + i);
        thisPrefix = sjcl.codec.hex.toBits(thisPrefix)

        ptk += sjcl.codec.hex.fromBits(new sjcl.misc.hmac(pmk, sjcl.hash.sha1).mac(thisPrefix));
        i++;
    }

    // Extract first 16 bytes (32 hex characters) of PTK to get KCK.
    var kck = ptk.substring(0, 32);
    return kck;
};

/**
 * Calculate MIC using KCK (given) and EAPOL frame bytes (from a message in the 4-way handshake).
 *
 * @param kck (string, hex) The Key-ConfirmationKey (KCK) computed from Crack.kckFromPmk().
 * @return (string, hex) The expected MIC.
 */
Crack.micFromKck = function (kck, isWPA, eapolFrameBytes) {
    kck = sjcl.codec.hex.toBits(kck)

    // NOTE: We expect the "MIC" portion of the EAPOL frame bytes to be *zeroed* out! From the 802.11 spec:
    // MIC(KCK, EAPOL) – MIC computed over the body of this EAPOL-Key frame with the Key MIC field first initialized to 0
    var bytes = sjcl.codec.hex.toBits(eapolFrameBytes)

    var computedMic;
    if (isWPA) {
        var b = CryptoJS.enc.Hex.parse(sjcl.codec.hex.fromBits(bytes));
        var c = CryptoJS.enc.Hex.parse(sjcl.codec.hex.fromBits(kck));
        computedMic = CryptoJS.HmacMD5(b, c).toString(); // Still using Crypto JS
    }
    else {
        computedMic = sjcl.codec.hex.fromBits(new sjcl.misc.hmac(kck, sjcl.hash.sha1).mac(bytes));
        computedMic = computedMic.substring(0, 32); // Extract 0-128 MSB per the 802.11 spec.
    }
    return computedMic;
}

