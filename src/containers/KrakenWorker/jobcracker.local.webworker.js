import Crack from './utils/WPA/Crack';

let fs, exec, promisify, writeFile, readFile, deleteFile
if (window.require) {
    fs = window.require("fs");
    exec = window.require("child_process").exec
    promisify = window.require("util").promisify;
    writeFile = promisify(fs.writeFile)
    readFile = promisify(fs.readFile)
    deleteFile = promisify(fs.unlink)
}

const JobCrackerLocal = (webWorkerId, callback) => {
    let hashCatProcess;

    const postMessage = async (message) => {
        console.log("Cracker received job with id " + message.jobId)
        let returnObject = { data: { jobId: message.jobId, crackingStatus: null, result: null } }
        const candidateValueFileName = 'tmp-candidate-values'
        const valueToMatchFileName = 'tmp-value-to-match'
        const outFileName = 'tmp-out'
        try {
            await writeFile(candidateValueFileName, message.candidateValues.join("\n"));
            await writeFile(outFileName, '');
            let valueToMatch = atob(message.valueToMatchInBase64)
            let hashcatMD5Mode = null
            let match = null
            switch (message.requestType) {
                case 'WPA':
                    const crack = new Crack(valueToMatch)
                    await writeFile(valueToMatchFileName, new Buffer(crack.hccapx._io._buffer))
                    hashcatMD5Mode = 2500;
                    break;
                case 'NTLM':
                    await writeFile(valueToMatchFileName, valueToMatch.toUpperCase().split("").join("\0") + "\0".toString());
                    hashcatMD5Mode = 1000
                    break;
                case 'MD5':
                    await writeFile(valueToMatchFileName, valueToMatch.toLowerCase())
                    hashcatMD5Mode = 0
                    break;
                default:
                    throw new Error("Request Type Unknown : " + message.requestType)
            }
            hashCatProcess = exec('hashcat ' +
                '--potfile-disable --attack-mode 0 --outfile-format 2 --hash-type ' + hashcatMD5Mode + ' ' + // Options
                '--outfile ' + outFileName + ' ' + valueToMatchFileName + ' ' + candidateValueFileName,      // Files
                (e, stdout, stderr) => { console.log(stdout); });                                 // Print
            let promise = new Promise((resolve, reject) => {
                hashCatProcess.on('close', (code) => {
                    if (code === 0 || code === 1)
                        resolve()
                    else
                        reject()
                });
            })
            await promise
            match = await readFile(outFileName, 'utf8')
            if (match !== null && match !== undefined && match !== "") {
                returnObject.data.crackingStatus = 'CRACKED';
                returnObject.data.result = match.split('\n').shift();
            }
            else {
                returnObject.data.crackingStatus = 'DONE';
            }
        }
        catch (error) {
            console.log(error);
            returnObject.data.crackingStatus = 'ERROR';
        }
        finally {
            // Delete Candidate Value  File
            await deleteFile(candidateValueFileName)
            // Delete Value to Match File
            await deleteFile(valueToMatchFileName)
            // Delete Out
            await deleteFile(outFileName)
            // Callback
            callback(returnObject)
        }
    }

    const terminate = () => {
        if (hashCatProcess) {
            console.log("Terminating HashCat Process");
            hashCatProcess.kill('SIGINT')
        }
    }

    return {
        webWorkerId: webWorkerId,
        postMessage: postMessage,
        terminate: terminate,
        callback: callback,
    }
}

export default JobCrackerLocal;