// backend/helpers/createFolderStructure.js

const fs = require('fs');
const path = require('path');

/**
 * Creates a folder for the user if it doesn't exist already.
 * @param {Object} settings - The settings object containing folder info.
 * @param {string} settings.path - Base path where folder should be created.
 * @param {string} settings.folder_name - The folder name to create.
 */
async function createFolderStructure(settings) {
    try {
        // Resolve the full path on disk (not just relative to backend)
        const fullPath = path.resolve(__dirname, '../../', settings.path, settings.folder_name);

        // If folder doesn't exist, create it
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, {
                recursive: true
            });
            console.log(`Folder created at: ${fullPath}`);
        } else {
            console.log(`Folder already exists: ${fullPath}`);
        }

    } catch (err) {
        console.error('Error creating folder structure:', err);
        throw err; // rethrow so caller knows something went wrong
    }
}

module.exports = createFolderStructure;