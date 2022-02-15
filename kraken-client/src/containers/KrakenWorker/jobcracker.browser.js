/* eslint-disable no-restricted-globals */
import FakeHashcat from './utils/FakeHashcat'

self.onmessage = async (message) => {
    console.debug("Cracker received job with id " + message.data.jobId + " chunkNo " + message.data.chunkNo)
    let returnObject = { webWorkerId: message.data.webWorkerId, jobId: message.data.jobId, chunkNo: message.data.chunkNo, result: {}, error: null }
    let valueToMatch = atob(message.data.valueToMatchInBase64)
    let mode = message.data.requestType
    let wordlist = message.data.candidateValues
    try {
        returnObject.result = await FakeHashcat.crack(mode, valueToMatch, wordlist)
    }
    catch (error) {
        returnObject.error = error;
    }
    finally {
        // Cleanup
        delete message.data.candidateValues
        delete message.data.valueToMatchInBase64

        // Return
        self.postMessage(returnObject)
    }
};