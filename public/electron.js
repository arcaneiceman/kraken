const electron = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
let mainWindow;

function createWindow() {
	mainWindow = new electron.BrowserWindow({
		width: 1200, height: 740,
		webPreferences: { nodeIntegration: true }
	});
	if (isDev) {
		mainWindow.loadURL("http://localhost:3000/login")
		mainWindow.webContents.openDevTools()
		mainWindow.resizable = true
		mainWindow.fullScreenable = true
	}
	else {
		mainWindow.loadURL(`file://${path.join(__dirname, "../build/index.html")}`)
		mainWindow.resizable = false
		mainWindow.fullScreenable = false
	}
	mainWindow.on("closed", () => (mainWindow = null));
}

electron.app.on("ready", createWindow);

electron.app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		electron.app.quit();
	}
});

electron.app.on("activate", () => {
	if (mainWindow === null) {
		createWindow();
	}
});
