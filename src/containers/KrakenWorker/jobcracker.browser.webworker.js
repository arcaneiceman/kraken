/* eslint-disable no-restricted-globals */
import Crack from './utils/WPA/Crack';
import CryptoJS from './utils/Crypto/crypto-js';
import md4 from '../KrakenWorker/utils/Crypto/md4';

self.onmessage = (message) => {
    console.log("Cracker received job with id " + message.data.jobId)
    let returnObject = { jobId: message.data.jobId, crackingStatus: null, result: null }
    try {
        let match = null;
        let valueToMatch = atob(message.data.valueToMatchInBase64)
        switch (message.data.requestType) {
            case 'WPA':
                const crack = new Crack(valueToMatch)
                match = message.data.candidateValues.find((element) => { return crack.tryPSK(element) })
                break;
            case 'NTLM':
                valueToMatch = valueToMatch.toLowerCase();
                match = message.data.candidateValues.find((element) => { 
                    return md4(element.split("").join("\0") + "\0") === valueToMatch });
                break;
            case 'MD5':
                valueToMatch = valueToMatch.toLowerCase();
                match = message.data.candidateValues.find((element) => { return CryptoJS.MD5(element).toString() === valueToMatch; });
                break;
            default:
                throw new Error("Request Type Unknown : " + message.data.requestType)
        }
        if (match !== null && match !== undefined && match !== "") {
            returnObject.crackingStatus = 'CRACKED';
            console.log(match)
            returnObject.result = match;
        }
        else {
            returnObject.crackingStatus = 'DONE';
        }
    }
    catch (e) {
        returnObject.crackingStatus = 'ERROR';
    }
    finally {
        self.postMessage(returnObject)
    }
};