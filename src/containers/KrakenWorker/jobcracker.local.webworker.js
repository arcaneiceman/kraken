import Crack from './utils/WPA/Crack';

let fs, os, exec, promisify, writeFile, readFile, deleteFile
if (window.require) {
    fs = window.require("fs");
    os = window.require("os")
    exec = window.require("child_process").exec
    promisify = window.require("util").promisify;
    writeFile = promisify(fs.writeFile)
    readFile = promisify(fs.readFile)
    deleteFile = promisify(fs.unlink)
}

const JobCrackerLocal = (webWorkerId, callback) => {
    let hashCatProcess;

    const postMessage = async (message) => {
        console.debug("Cracker received job with id " + message.jobId)
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
            const hashcatBinary = getHashcatBinary()
            hashCatProcess = exec(hashcatBinary + ' ' +
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
            callback(returnObject)
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
        }
    }

    const terminate = () => {
        if (hashCatProcess) {
            console.log("Terminating HashCat Process");
            hashCatProcess.kill('SIGINT')
        }
    }

    const test = async () => {
        try {
            const hashcatBinary = getHashcatBinary()
            let output;
            let error;
            hashCatProcess = await exec(hashcatBinary + ' ' + 
                '--version', (e, stdout, stderr) => { output = stdout; error = stderr })
            let promise = new Promise((resolve, reject) => {
                hashCatProcess.on('close', (code) => {
                    if (code === 0 || code === 1)
                        resolve(output)
                    else
                        reject(error)
                });
            })
            await promise
            return output.includes('v5.') ? "MET" : output
        }
        catch (error) {
            return error;
        }
    }

    const getInstallationSteps = () => {
        switch (os.platform()){
            case 'darwin':
                return ['ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"', "brew install hashcat"];
            case 'linux':
                return ['sudo apt-get install hashcat'];
            case 'win32':
                return "windows"
            default:
                throw new Error("Platform is not Windows, Mac or Linux")
        }
    }

    // Private Functions
    const getHashcatBinary = () => {
        switch (os.platform()){
            case 'darwin':
                return 'hashcat';
            case 'linux':
                return 'hashcat';
            case 'win32':
                switch(process.arch){
                    case 'x64':
                        return './hashcat64'
                    case 'x32':
                        return './hashcat32'
                    default:
                        throw new Error("Platform is Windows but could not determine architecture")
                }
            default:
                throw new Error("Platform is not Windows, Mac or Linux")
        }
    }

    return {
        webWorkerId: webWorkerId,
        postMessage: postMessage,
        terminate: terminate,
        callback: callback,
        test: test,
        getInstallationSteps : getInstallationSteps
    }
}

export default JobCrackerLocal;