/* eslint-disable no-restricted-globals */
import Crack from './utils/WPA/Crack';
import CryptoJS from './utils/Crypto/crypto-js';
import md4 from './utils/Crypto/md4';

self.onmessage = async (message) => {
    console.debug("Cracker received job with id " + message.data.jobId)
    let returnObject = { jobId: message.data.jobId, crackingStatus: null, result: null, error: null }
    try {
        let match = null;
        let valueToMatch = atob(message.data.valueToMatchInBase64)
        switch (message.data.requestType) {
            case 'WPA':
                const crack = new Crack(valueToMatch)
                for (let i = 0; i < message.data.candidateValues.length; i++){
                    let answer = await crack.tryPSK(message.data.candidateValues[i])
                    if (answer)
                        match = message.data.candidateValues[i]
                }
                break;
            case 'NTLM':
                valueToMatch = valueToMatch.toLowerCase();
                match = message.data.candidateValues.find((element) => {
                    return md4(element.split("").join("\0") + "\0") === valueToMatch
                });
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
            returnObject.result = match;
        }
        else {
            returnObject.crackingStatus = 'DONE';
        }
    }
    catch (error) {
        returnObject.crackingStatus = 'ERROR';
        returnObject.error = error;
    }
    finally {
        self.postMessage(returnObject)
    }
};