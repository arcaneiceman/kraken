const electron = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
let mainWindow;

function createWindow() {
	mainWindow = new electron.BrowserWindow({
		width: 1200, height: 750,
		webPreferences: { nodeIntegration: true }
	});
	if (isDev) {
		mainWindow.loadURL("http://localhost:3000")
		mainWindow.webContents.openDevTools()
	}
	else {
		mainWindow.loadURL(`file://${path.join(__dirname, "../build/index.html")}`)
	}
	// Hide Menu Bar
	mainWindow.setMenuBarVisibility(false)

	// Handle External Links
	mainWindow.webContents.on('new-window', function (e, url) {
		e.preventDefault();
		electron.shell.openExternal(url);
	});

	// Handle Close
	mainWindow.on("closed", () => (mainWindow = null));

	// Set Content Security Policy
	electron.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				'Content-Security-Policy': ['script-src \'self\'']
			}
		})
	})
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

