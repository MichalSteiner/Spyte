const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
    const mainWindow = new BrowserWindow({
        show: false, // This makes the window fullscreen
        frame: true,
        resizable: true,
        webPreferences: {
            preload: path.join(__dirname, 'renderer.js'),
            nodeIntegration: true,  // Enable Node integration if needed
            contextIsolation: false // Disable context isolation if Node integration is enabled
        }
    });

    // Handle request from renderer to load text file
    ipcMain.handle('load-text-file', async (event, filePath) => {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            return content;
        } catch (err) {
            console.error('Failed to read file:', err);
            return '';
        }
    });

    ipcMain.handle('save-translations', async (event, translations) => {
        const filePath = path.join(__dirname, 'translations.txt');
        try {
            fs.writeFileSync(filePath, translations.join('\n\n'), 'utf-8');
        } catch (err) {
            console.error('Failed to save translations:', err);
        }
    });

    mainWindow.maximize(); // Maximize the window to take up the entire screen but still keep the title bar
    mainWindow.show(); // Show the window once it’s maximized
    mainWindow.loadFile('index.html');

}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
