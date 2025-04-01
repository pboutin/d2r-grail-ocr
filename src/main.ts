import { app, BrowserWindow, globalShortcut } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";

import ocr from "./ocr";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.commandLine.appendSwitch("enable-features", "GlobalShortcutsPortal");

app.whenReady().then(() => {
  const ret = globalShortcut.register("F12", () => {
    ocr();
  });

  if (!ret) {
    console.log(" keyboard shortcut registration failed");
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
