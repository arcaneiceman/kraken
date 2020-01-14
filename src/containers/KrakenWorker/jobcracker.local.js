import Crack from './utils/WPA/Crack';
import { isExpressionWrapper } from '@babel/types';

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
        let returnObject = { data: { jobId: message.jobId, crackingStatus: null, result: null, error: null } }
        const candidateValueFileName = '/tmp/kraken-candidate-values'
        const valueToMatchFileName = '/tmp/kraken-value-to-match'
        const outFileName = '/tmp/kraken-out'
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
            const devices = message.devices.filter(device => device.enabled).map(device => device.id).join(',')
            let output;
            let error;
            const hashcatBinary = getHashcatBinary()
            console.log(hashcatBinary + ' ' +
                '--potfile-disable --attack-mode 0 --outfile-format 2 --hash-type ' + hashcatMD5Mode + ' ' + // Options
                '--opencl-device-types 1,2,3 --opencl-devices ' + devices + ' ' +                            // Devices
                '--outfile ' + outFileName + ' ' + valueToMatchFileName + ' ' + candidateValueFileName)
            hashCatProcess = exec(hashcatBinary + ' ' +
                '--potfile-disable --attack-mode 0 --outfile-format 2 --hash-type ' + hashcatMD5Mode + ' ' + // Options
                '--opencl-device-types 1,2,3 --opencl-devices ' + devices + ' ' +                            // Devices
                '--outfile ' + outFileName + ' ' + valueToMatchFileName + ' ' + candidateValueFileName,      // Files
                (e, stdout, stderr) => { output = stdout; error = stderr; });
            let promise = new Promise((resolve, reject) => {
                hashCatProcess.on('close', (code) => {
                    if (code === 0 || code === 1)
                        resolve(output)
                    else
                        reject(error)
                });
            })
            await promise
            if (output)
                console.log(output)
            if (error)
                console.log(error)
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
            returnObject.data.error = error;
        }
        finally {
            // Send Callback
            callback(returnObject)
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

    const listDevices = async () => {
        try {
            const hashcatBinary = getHashcatBinary()
            let output;
            let error;
            hashCatProcess = await exec(hashcatBinary + ' ' +
                '--opencl-info', (e, stdout, stderr) => { output = stdout; error = stderr; });
            let promise = new Promise((resolve, reject) => {
                hashCatProcess.on('close', (code) => {
                    if (code === 0 || code === 1) {
                        resolve(output)
                    } else {
                        reject(error)
                    }
                });
            })
            await promise
            if (output)
                console.log(output)
            if (error)
                console.log(error)
            return output
        }
        catch (error) {
            return error;
        }
    }

    const getPlatform = () => {
        return os.platform()
    }

    // Private Functions
    const getHashcatBinary = () => {
        switch (os.platform()) {
            case 'darwin':
                return '/usr/local/bin/hashcat';
            case 'linux':
                return 'hashcat';
            case 'win32':
                switch (process.arch) {
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
        listDevices: listDevices,
        getPlatform: getPlatform
    }
}

export default JobCrackerLocal;