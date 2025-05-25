// File: backend/utils/fileUtils.js
const fs = require("fs");
const path = require("path");
const db = require("../models"); // Adjust this path to your models directory


// Function to create folder structure
const createFolderStructure = async (settings) => {
  const folderPath = path.join(settings.path, settings.folder_name);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
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