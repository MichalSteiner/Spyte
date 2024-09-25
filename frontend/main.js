const { app, BrowserWindow, ipcMain, dialog } = require('electron');
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
            enableRemoteModule: false,
            contextIsolation: false // Disable context isolation if Node integration is enabled
        }
    });

    // Handle text file selection
    ipcMain.handle('select-file', async (event, lastDirectory) => {
        const defaultDirectory = lastDirectory || path.join(__dirname, '../shared/novels');
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            defaultPath: defaultDirectory,
            filters: [
                { name: 'Text Files', extensions: ['txt'] },
                { name: 'All Files', extensions: ['*'] },
            ],
        });

        if (!result.canceled) {
            const selectedPath = result.filePaths[0];
            return selectedPath;
        }

        return { filePath: null};
    });

    // Handle loading of text files
    ipcMain.handle('load-text-file', async (event, filePath) => {
        try {
            // Load Japanese content
            const content = fs.readFileSync(filePath, 'utf-8');
    
            // Construct the path for the corresponding English translation
            const parsedPath = path.parse(filePath);
            const englishFilePath = path.join(parsedPath.dir, '..', 'english', parsedPath.base);
    
            let englishContent = null;
    
            // Check if the English translation file exists
            if (fs.existsSync(englishFilePath)) {
                englishContent = fs.readFileSync(englishFilePath, 'utf-8');
            }
    
            // Return both Japanese and English content
            return { japaneseContent: content, englishContent };
        } catch (err) {
            console.error('Failed to read file:', err);
            return { japaneseContent: '', englishContent: null };
        }
    });

    ipcMain.handle('save-translations', async (event, translations, originalFilePath) => {
        const parsedPath = path.parse(originalFilePath);
        const novelBaseDir = path.join(parsedPath.dir, '..', 'english'); // Navigate to the 'english' folder
        const savePath = path.join(novelBaseDir, parsedPath.base); // Save with the same filename
    
        // Ensure the target directory exists
        if (!fs.existsSync(novelBaseDir)) {
            fs.mkdirSync(novelBaseDir, { recursive: true });
        }
        try {
            fs.writeFileSync(savePath, translations.join('\n\n'), 'utf-8');
            return { canceled: false, filePath: savePath };
        } catch (err) {
            console.error('Failed to save file:', err);
            return { canceled: true };
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
