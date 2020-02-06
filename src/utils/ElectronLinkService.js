import isElectron from 'is-electron';
let electron;
if (window.require) {
    electron = window.require("electron");
}

const handleLink = (event) => {
    if (!isElectron())
        return true;
    event.preventDefault();
    let link = event.target.href;
    electron.shell.openExternal(link);
}

const ElectronLinkService = {
    handleLink
}

export default ElectronLinkService;