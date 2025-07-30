// File: backend/utils/fileUtils.js
const fs = require("fs");
const path = require("path");
const db = require("../models"); // Adjust this path to your models directory


// Function to create folder structure
const createFolderStructure = async (settings) => {
  // Resolve absolute path from __dirname (current file location) + relative path from settings
  const folderPath = path.resolve(__dirname, "..", settings.path, settings.folder_name);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log("Created folder:", folderPath);
  }
};

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')      // Replace spaces with -
    .replace(/[^\w\-]+/g, '')  // Remove all non-word chars
    .replace(/\-\-+/g, '-');   // Replace multiple - with single -
};


module.exports = { createFolderStructure, slugify };