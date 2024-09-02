const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

function createWindow() {
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
        title: "SushiReminder",
        icon: path.join('sushilogo16.png'),
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			sandbox: false,
		},
	});

	mainWindow .loadFile("index.html");
}

app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    app.setName("SushiReminder");
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
