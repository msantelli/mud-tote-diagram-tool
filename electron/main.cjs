const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/icons/icon.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    show: false, // Don't show until ready
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });

  // Load the app
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // Use file:// protocol with proper path resolution for production
    const htmlPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading HTML from:', htmlPath);
    mainWindow.loadFile(htmlPath);
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on the window
    if (isDev) {
      mainWindow.focus();
    }
  });

  // Debug: Log page load events
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Page failed to load:', errorCode, errorDescription, validatedURL);
  });

  // DevTools disabled in production for clean user experience

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Diagram',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              // Clear the current diagram
              if (window.clearDiagram) {
                window.clearDiagram();
              }
            `);
          }
        },
        {
          label: 'Import Diagram...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });

            if (!result.canceled && result.filePaths.length > 0) {
              const filePath = result.filePaths[0];
              try {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const diagram = JSON.parse(fileContent);
                
                // Send the diagram data to the renderer
                mainWindow.webContents.executeJavaScript(`
                  if (window.importDiagram) {
                    window.importDiagram(${JSON.stringify(diagram)});
                  }
                `);
              } catch (error) {
                dialog.showErrorBox('Import Error', `Failed to import diagram: ${error.message}`);
              }
            }
          }
        },
        {
          label: 'Export Diagram...',
          accelerator: 'CmdOrCtrl+S',
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow, {
              defaultPath: 'mud-diagram.json',
              filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });

            if (!result.canceled) {
              // Get diagram data from renderer
              const diagram = await mainWindow.webContents.executeJavaScript(`
                window.exportDiagram ? window.exportDiagram() : null
              `);

              if (diagram) {
                try {
                  fs.writeFileSync(result.filePath, JSON.stringify(diagram, null, 2));
                  dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: 'Export Successful',
                    message: 'Diagram exported successfully!'
                  });
                } catch (error) {
                  dialog.showErrorBox('Export Error', `Failed to export diagram: ${error.message}`);
                }
              }
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              if (window.undo) {
                window.undo();
              }
            `);
          }
        },
        {
          label: 'Redo',
          accelerator: process.platform === 'darwin' ? 'Cmd+Shift+Z' : 'Ctrl+Y',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              if (window.redo) {
                window.redo();
              }
            `);
          }
        },
        { type: 'separator' },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              if (window.selectAll) {
                window.selectAll();
              }
            `);
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              if (window.zoomIn) {
                window.zoomIn();
              }
            `);
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              if (window.zoomOut) {
                window.zoomOut();
              }
            `);
          }
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              if (window.resetZoom) {
                window.resetZoom();
              }
            `);
          }
        },
        {
          label: 'Center Diagram',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              if (window.centerDiagram) {
                window.centerDiagram();
              }
            `);
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.reload();
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About MUD & TOTE Diagram Tool',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: 'MUD & TOTE Diagram Tool',
              detail: 'Interactive visualization tool for Meaning-Use Diagrams and TOTE Cycles based on Robert Brandom\'s philosophical framework.\n\nVersion: 1.0.0\nBuilt with Electron and React'
            });
          }
        },
        {
          label: 'Learn More',
          click: () => {
            shell.openExternal('https://github.com/msantelli/mud-tote-diagram-tool');
          }
        }
      ]
    }
  ];

  // macOS-specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          label: 'About ' + app.getName(),
          role: 'about'
        },
        { type: 'separator' },
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        { type: 'separator' },
        {
          label: 'Hide ' + app.getName(),
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    });

    // Remove duplicate File->Quit on macOS
    template[1].submenu.pop();
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // On macOS, keep the app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create a window when the dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationURL) => {
    navigationEvent.preventDefault();
    shell.openExternal(navigationURL);
  });
});