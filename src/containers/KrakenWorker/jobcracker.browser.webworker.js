/* eslint-disable no-restricted-globals */
import Crack from './utils/WPA/Crack';
import CryptoJS from './utils/Crypto/crypto-js'

self.onmessage = (message) => {
    console.log( "Cracker received job with id " + message.data.jobId )
    let returnObject = { jobId: message.data.jobId, crackingStatus: null, result: null }
    try {
        let match = null;
        let valueToMatch = atob(message.data.valueToMatchInBase64)
        switch (message.data.requestType) {
            case 'WPA':
                //console.log("Processing WPA Request...");
                const crack = new Crack(valueToMatch)
                match = message.data.candidateValues.find((element) => { return crack.tryPSK(element) })
                break;
            case 'MD5':
                //console.log("Processing MD5 Request...");
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
    finally{
        self.postMessage(returnObject)
    }
};