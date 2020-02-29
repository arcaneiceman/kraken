import Hccapx from './utils/WPA/HccapxFile'
import KaitaiStream from 'kaitai-struct/KaitaiStream'

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
        let returnObject = { data: { jobId: message.jobId, chunkNo: message.chunkNo, result: {}, error: null } }
        const candidateValueFileName = getTmpFilePath('kraken-candidate-values')
        const valueToMatchFileName = getTmpFilePath('kraken-value-to-match')
        const outFileName = getTmpFilePath('kraken-out')
        const mode = message.requestType;
        try {
            await writeFile(candidateValueFileName, message.candidateValues.join("\n"));
            await writeFile(outFileName, '');
            await writeFile(valueToMatchFileName, new Buffer(new Hccapx(new KaitaiStream(str2ab(atob(message.valueToMatchInBase64))))._io._buffer))
            if (message.devices.length === 0)
                throw Error("No Enabled Devices")
            let output, error, result;
            const devices = message.devices.filter(device => device.enabled).map(device => device.id).join(',')
            const hashcatBinary = getHashcatBinary()
            console.log(hashcatBinary + ' ' +
                '--potfile-disable --attack-mode 0 --outfile-format 3 --hash-type ' + mode + ' ' +     // Options
                '--opencl-device-types 1,2,3 --opencl-devices ' + devices + ' --force ' +              // Devices
                '--outfile ' + outFileName + ' ' + valueToMatchFileName + ' ' + candidateValueFileName)// Files
            hashCatProcess = exec(hashcatBinary + ' ' +
                '--potfile-disable --attack-mode 0 --outfile-format 3 --hash-type ' + mode + ' ' +     // Options
                '--opencl-device-types 1,2,3 --opencl-devices ' + devices + ' --force ' +              // Devices
                '--outfile ' + outFileName + ' ' + valueToMatchFileName + ' ' + candidateValueFileName,// Files
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
            result = await readFile(outFileName, 'utf8')
            if (result !== null && typeof result !== 'undefined' && result !== "") {
                const resultLines = result.split('\n') // .shift/*  */
                resultLines
                    .filter(resultLine => !(resultLine === null || typeof resultLine === 'undefined' || resultLine === ""))
                    .forEach(resultLine => {
                        const resultTokens = resultLine.split(':');
                        returnObject.data.result[resultTokens[resultTokens.length - 2]] = resultTokens[resultTokens.length - 1]
                    })
            }
        }
        catch (error) {
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
            return (output === null || typeof output === 'undefined' || output === '') ? error : output
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
                        return 'cd ' + window.process.env.PORTABLE_EXECUTABLE_DIR + ' &&  hashcat64.exe'
                    case 'x32':
                        return 'cd ' + window.process.env.PORTABLE_EXECUTABLE_DIR + ' &&  hashcat32.exe'
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

    const str2ab = function (str) {
        var buf = new ArrayBuffer(str.length);
        var bufView = new Uint8Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
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