const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'), // Use the preload script
        contextIsolation: true, // Enable context isolation
        nodeIntegration: false, // Disable node integration in the renderer
        sandbox: false // Disable sandboxing
      }
    });
  
    win.loadFile('index.html');
  }  

app.whenReady().then(() => {
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
