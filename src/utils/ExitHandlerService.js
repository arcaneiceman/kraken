import isElectron from 'is-electron';
let electron;
if (window.require) {
    electron = window.require("electron");
}

const handleExit = async (event) => {
    event.returnValue = false
    if (isElectron()) {
        let result = await electron.remote.dialog.showMessageBox({
            message: 'The worker is still running. Do you still want to quit?',
            buttons: ['Yes', 'No']
        })
        if (result.response === 0) { // Yes 
            window.removeEventListener("beforeunload", handleExit)
            electron.remote.getCurrentWindow().close()
        }
    }
}

const ExitHandlerService = {
    handleExit
}

export default ExitHandlerService; 