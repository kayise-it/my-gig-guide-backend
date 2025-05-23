// File: backend/utils/changeFolderName.js
const fs = require("fs");
const path = require("path");

// Change the name of the folder from the old name to the new name
exports.changeFolderName = async (role, oldFolderName, newFolderName) => {
  try {
    const baseDir = path.join(__dirname, "..", "uploads", role); // Directory for the folders
    const oldFolderPath = path.join(baseDir, oldFolderName);
    const newFolderPath = path.join(baseDir, newFolderName);

    if (fs.existsSync(oldFolderPath)) {
      fs.renameSync(oldFolderPath, newFolderPath);
      console.log(`Folder name changed from ${oldFolderName} to ${newFolderName}`);
    } else {
      console.log(`Old folder not found. Creating a new folder: ${newFolderName}`);
      fs.mkdirSync(newFolderPath, { recursive: true });
    }
  } catch (err) {
    console.error("Error changing folder name:", err);
    throw new Error("Failed to change folder name");
  }
};