// /* eslint-disable */

// /**
//  * Algorithm:
//  *
//  * Construct PMK using
//  *  - passphrase (from user input or list) and
//  *  - SSID (from user input or beacon frame).
//  * pmk = pbkdf2_sha1(passphrase, ssid, 4096, 256)
//  *
//  * Construct PTK using
//  *  - PMK (step 1)
//  *  - AP bssid, STATION bssid, ANonce, SNonce (from Handshake 3 of 4)
//  * ... (wpa_pmk_to_ptk)
//  *
//  * Construct MIC we expect to see in 4-of-4 using
//  *  - PTK (Step 2)
//  *  - EAPOL Frame (Handshake 4 of 4)
//  */
// import CryptoJS from '../Crypto/crypto-js'
// import KaitaiStream from 'kaitai-struct/KaitaiStream'
// import Hccapx from '../../utils/WPA/HccapxFile'

// export default function Crack(hccapx) {
//     // Parse hccapx file
//     this.hccapx = new Hccapx(new KaitaiStream(Crack.str2ab(hccapx)));
//     if (this.hccapx.records.length === 0)
//         throw Error("Did not find any handshakes")

// }

// Crack.prototype.tryPSK = async function (psk) {

//     // For each Handshake
//     for (let i = 0; i < this.hccapx.records.length; i++) {
//         // Extract ESSID and generate PMK
//         let pmk = await Crack.pmk(psk, String.fromCharCode.apply(null, this.hccapx.records[0].essid));
        
//         // Generate Prefix using Source Address, Desination Address and both nonces
//         let srcAddress = Crack.buf2hex(this.hccapx.records[i].macAp)
//         let dstAddress = Crack.buf2hex(this.hccapx.records[i].macStation)
//         let anonce = Crack.buf2hex(this.hccapx.records[i].nonceAp)
//         let snonce = Crack.buf2hex(this.hccapx.records[i].nonceStation)
//         let prfPrefix = Crack.getPrfPrefix(srcAddress, dstAddress, anonce, snonce);

//         // Get Whether this is WPA or WPA2
//         let isWPA = (this.hccapx.records[0].keyver === 1)

//         // Get EAPOL
//         let eapolFrameBytes = Crack.buf2hex(this.hccapx.records[i].eapol)

//         // Get MIC
//         let mic = Crack.buf2hex(this.hccapx.records[i].keymic)

//         // Generate KCK
//         let kck = Crack.kckFromPmk(pmk, prfPrefix)

//         // Generate Computed MIC
//         let computedMic = Crack.micFromKck(kck, isWPA, eapolFrameBytes)

//         if (computedMic === mic)
//             return ""
//     }
//     return false
// };

// Crack.str2ab = function (str) {
//     var buf = new ArrayBuffer(str.length);
//     var bufView = new Uint8Array(buf);
//     for (var i = 0, strLen = str.length; i < strLen; i++) {
//         bufView[i] = str.charCodeAt(i);
//     }
//     return buf;
// }

// Crack.buf2hex = function (buffer) {
//     return Array.prototype.map.call(new Uint8Array(buffer),
//         x => ('00' + x.toString(16)).slice(-2)).join('');
// }

// Crack.stringToHex = function (s) {
//     var result = "", i, x;
//     for (i = 0; i < s.length; i++) {
//         x = s.charCodeAt(i).toString(16);
//         while (x.length < 2) {
//             x = "0" + x;
//         }
//         result += x;
//     }
//     return result;
// };

// /**
//  * Compute prefix of one of the inputs to Pseudo-Random Function (PRF, see Crack.kckFromPmk).
//  * The "prefix" contains the "Pairwise Key Expansion", addresses, and nonces.
//  * @return (string, hex) PRF prefix.
//  */
// Crack.getPrfPrefix = function (srcAddress, dstAddress, snonce, anonce) {
//     var prefix = "";
//     prefix = Crack.stringToHex("Pairwise key expansion");
//     prefix += "00";
//     if (srcAddress < dstAddress) {
//         prefix += srcAddress;
//         prefix += dstAddress;
//     } else {
//         prefix += dstAddress;
//         prefix += srcAddress;
//     }
//     if (snonce < anonce) {
//         prefix += snonce;
//         prefix += anonce;
//     } else {
//         prefix += anonce;
//         prefix += snonce;
//     }
//     return prefix;
// };

// /**
//  * Calculates Pairwise Master Key (PMK).
//  * Uses PBKDF2 which may take a while...
//  *
//  * @param key (string) The plaintext key/password (PSK).
//  * @param ssid (string, optional) SSID (name of Wireless Access Point). Uses SSID from CapFile if not given.
//  * @return (CryptoJS-encoded object) The PMK (256bits/32Bytes).
//  */
// Crack.pmk = async function (key, essid) {
//     const importedKey = await crypto.subtle.importKey("raw", Crack.str2ab(key), { name: "PBKDF2" }, false, ["deriveKey", "deriveBits"]);
//     const params = { name: "PBKDF2", hash: { name: "SHA-1" }, salt: Crack.str2ab(essid), iterations: 4096 };
//     const derivation = await crypto.subtle.deriveBits(params, importedKey, 256);
//     return Crack.buf2hex(derivation)
// };

// /**
//  * Psudo-Random Function to calculate KCK (Key-Confirmation Key) from the PTK (Pairwise Transient Key).
//  * Computes part of PTK using the given PMK.
//  *
//  * Uses "prfPrefix" calculated in Crack.getPrfPrefix().
//  *
//  * @param pmk (CryptoJS-encoded object) The PMK, calculated from Crack.pmk()
//  * @return (string, hex) The KCK (first 16 bytes of the PTK).
//  *
//  */
// Crack.kckFromPmk = function (pmk, prfPrefix) {
//     pmk = CryptoJS.enc.Hex.parse(pmk) // <- Added This Line to convert PMK from Hex to Words
//     var i = 0, ptk = "", thisPrefix;
//     while (i < (64 * 8 + 159) / 160) {
//         thisPrefix = prfPrefix + ("0" + i);

//         thisPrefix = CryptoJS.enc.Hex.parse(thisPrefix);
//         ptk += CryptoJS.HmacSHA1(thisPrefix, pmk).toString();

//         i++;
//     }
//     var kck = ptk.substring(0, 32);
//     return kck;
// };

// /**
//  * Calculate MIC using KCK (given) and EAPOL frame bytes (from a message in the 4-way handshake).
//  *
//  * @param kck (string, hex) The Key-ConfirmationKey (KCK) computed from Crack.kckFromPmk().
//  * @return (string, hex) The expected MIC.
//  */
// Crack.micFromKck = function (kck, isWPA, eapolFrameBytes) {
//     kck = CryptoJS.enc.Hex.parse(kck);
//     var bytes = CryptoJS.enc.Hex.parse(eapolFrameBytes);

//     var computedMic;
//     if (isWPA) {
//         computedMic = CryptoJS.HmacMD5(bytes, kck).toString();
//     }
//     else {
//         computedMic = CryptoJS.HmacSHA1(bytes, kck).toString();
//         computedMic = computedMic.substring(0, 32);
//     }
//     return computedMic;
// }

// var test = async () => {
//     var pmk = await Crack.pmk("10zZz10ZZzZ", "Netgear 2/158")
//     console.log(pmk)
//     var prfPrefix = Crack.getPrfPrefix("001e2ae0bdd0", "cc08e0620bc8", "60eff10088077f8b03a0e2fc2fc37e1fe1f30f9f7cfbcfb2826f26f3379c4318", "61c9a3f5cdcdf5fae5fd760836b8008c863aa2317022c7a202434554fb38452b" )
//     console.log(prfPrefix)
//     var kck = Crack.kckFromPmk(pmk, prfPrefix)
//     console.log(kck)
//     var mic = Crack.micFromKck(kck, true, "0103005ffe01090020000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000")
//     console.log(mic)
// }
