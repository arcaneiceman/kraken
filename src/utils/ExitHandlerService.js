import isElectron from 'is-electron';
let electron;
if (window.require) {
    electron = window.require("electron");
}

const handleExit = async (event) => {
    if (isElectron()) {
        let result = await electron.remote.dialog.showMessageBox({
            message: 'The worker is still running. Do you still want to quit?',
            buttons: ['Yes', 'No']
        })
        if (result.response === 0)
            electron.remote.getCurrentWindow().close()
    }
    else{
        event.returnValue = false
    }
}

const ExitHandlerService = {
    handleExit
}

export default ExitHandlerService; 