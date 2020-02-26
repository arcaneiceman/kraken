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
        console.debug("Cracker received job with id " + message.jobId)
        let returnObject = { data: { jobId: message.jobId, crackingStatus: null, result: null, error: null } }
        const candidateValueFileName = getTmpFilePath('kraken-candidate-values')
        const valueToMatchFileName = getTmpFilePath('kraken-value-to-match')
        const outFileName = getTmpFilePath('kraken-out')
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
            if (message.devices.length === 0)
                throw Error("No Enabled Devices")
            const devices = message.devices.filter(device => device.enabled).map(device => device.id).join(',')
            let output;
            let error;
            const hashcatBinary = getHashcatBinary()
            console.log(hashcatBinary + ' ' +
                '--potfile-disable --attack-mode 0 --outfile-format 2 --hash-type ' + hashcatMD5Mode + ' ' + // Options
                '--opencl-device-types 1,2,3 --opencl-devices ' + devices + ' --force ' +                    // Devices
                '--outfile ' + outFileName + ' ' + valueToMatchFileName + ' ' + candidateValueFileName)      // Files
            hashCatProcess = exec(hashcatBinary + ' ' +
                '--potfile-disable --attack-mode 0 --outfile-format 2 --hash-type ' + hashcatMD5Mode + ' ' + // Options
                '--opencl-device-types 1,2,3 --opencl-devices ' + devices + ' --force ' +                     // Devices
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
            // Cleanup Files
            await deleteFile(candidateValueFileName)
            await deleteFile(valueToMatchFileName)
            await deleteFile(outFileName)

            // Return
            callback(returnObject)
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
                '--opencl-info --force', (e, stdout, stderr) => { output = stdout; error = stderr; });
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
            return (output === null || output === undefined || output === '') ? error : output
        }
        catch (error) {
            return error;
        }
    }

    const getPlatform = () => {
        return window.process.platform
    }

    // Private Functions
    const getHashcatBinary = () => {
        switch (window.process.platform) {
            case 'darwin':
                return '/usr/local/bin/hashcat';
            case 'linux':
                return 'hashcat';
            case 'win32':
                switch (window.process.arch) {
                    case 'x64':
                        return  'cd ' + window.process.env.PORTABLE_EXECUTABLE_DIR + ' &&  hashcat64.exe'
                    case 'x32':
                        return  'cd ' + window.process.env.PORTABLE_EXECUTABLE_DIR + ' &&  hashcat32.exe'
                    default:
                        throw new Error("Platform is Windows but could not determine architecture")
                }
            default:
                throw new Error("Platform is not Windows, Mac or Linux")
        }
    }

    const getTmpFilePath = (filename) => {
        switch (window.process.platform) {
            case 'darwin':
            case 'linux':
                return '/tmp/' + filename;
            case 'win32':
                return window.process.env.PORTABLE_EXECUTABLE_DIR + '//' + filename;
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