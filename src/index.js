const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const ffmpeg = require('fluent-ffmpeg')
const path = require('path');
const fs = require('fs');
const jimp = require('jimp')
const ffbinaries = require('ffbinaries');

ffbinaries.downloadBinaries(function () {
  console.log('Downloaded all ffmpeg binaries for current platform.');
});

let mainWindow;
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 600,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}\\index.html`);

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


ipcMain.on('video:submit', (e, path) => {

  ffmpeg.ffprobe(path, (err, metadata) => {
    console.log(metadata)
  })

});
let outputDir = __dirname
const imgpatt = /\.(jpe?g|png|bmp)$/i
function doStuff(folderPath) {

  folderPath.forEach((folder) => {
    console.log(outputDir)
    fs.readdir(folder, (err, files) => {
      files.forEach(file => {
        if (imgpatt.test(file)) {
          jimp.read(path.join(folder, file))
            .then(lenna => {
              return lenna
                .quality(100) // set JPEG quality
                .write(path.join(outputDir,file.split('.')[0] + '.jpg')); // save
            }).then((lenna) => {
              mainWindow.webContents.send('image:changed', outputDir + "/" + file);
            })
            .catch(err => {
              console.error(err);
            });
        }
      });
    });
  })

}

ipcMain.on('selectOutputDirectory', function () {

  dialog.showOpenDialog({
    properties: ['openDirectory']
  }).then(result => {
    if (!result.canceled) {
      outputDir = result.filePaths[0];
      
    }
  }).catch(err => {
    console.log(err)
  })
});

let dir;
ipcMain.on('selectDirectory', function () {

  dialog.showOpenDialog({
    properties: ['openDirectory']
  }).then(result => {
    console.log(result.canceled)
    if (!result.canceled) {
      doStuff(result.filePaths);
    }
  }).catch(err => {
    console.log(err)
  })
});