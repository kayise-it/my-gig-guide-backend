// File: backend/utils/fileUtils.js
const fs = require("fs");
const path = require("path");
const db = require("../models"); // Adjust this path to your models directory

// Function to create folder structure
const createFolderStructure = async (settings) => {
  try {
    // Resolve absolute path from __dirname (current file location) + relative path from settings
    const folderPath = path.resolve(__dirname, "..", settings.path, settings.folder_name);
    
    console.log("🔧 Creating folder structure:");
    console.log("  - Settings path:", settings.path);
    console.log("  - Folder name:", settings.folder_name);
    console.log("  - Resolved path:", folderPath);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log("✅ Created folder:", folderPath);
      
      // Create subfolders for artists
      if (settings.path.includes('artists')) {
        const subfolders = ['events', 'venues', 'profile', 'gallery'];
        for (const subfolder of subfolders) {
          const subfolderPath = path.join(folderPath, subfolder);
          if (!fs.existsSync(subfolderPath)) {
            fs.mkdirSync(subfolderPath, { recursive: true });
            console.log("✅ Created subfolder:", subfolderPath);
          }
        }
      }
      
      // Create subfolders for organisers
      if (settings.path.includes('organiser')) {
        const subfolders = ['events', 'venues', 'profile'];
        for (const subfolder of subfolders) {
          const subfolderPath = path.join(folderPath, subfolder);
          if (!fs.existsSync(subfolderPath)) {
            fs.mkdirSync(subfolderPath, { recursive: true });
            console.log("✅ Created subfolder:", subfolderPath);
          }
        }
      }
    } else {
      console.log("ℹ️ Folder already exists:", folderPath);
    }
    
    return folderPath;
  } catch (error) {
    console.error("❌ Error creating folder structure:", error);
    throw error;
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