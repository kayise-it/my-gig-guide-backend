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
        // settings.path is "frontend/public/artists/" so we need to go up two levels from backend/helpers to reach project root
        const fullPath = path.resolve(__dirname, '..', '..', settings.path, settings.folder_name);
        
        console.log("🔧 Creating folder structure:");
        console.log("  - Settings path:", settings.path);
        console.log("  - Folder name:", settings.folder_name);
        console.log("  - Resolved path:", fullPath);

        // If folder doesn't exist, create it
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`✅ Created folder: ${fullPath}`);
            
            // Create subfolders for artists
            if (settings.path.includes('artists')) {
                const subfolders = ['events', 'venues', 'profile', 'gallery'];
                for (const subfolder of subfolders) {
                    const subfolderPath = path.join(fullPath, subfolder);
                    if (!fs.existsSync(subfolderPath)) {
                        fs.mkdirSync(subfolderPath, { recursive: true });
                        console.log(`✅ Created subfolder: ${subfolderPath}`);
                    }
                }
            }
            
            // Create subfolders for organisers
            if (settings.path.includes('organiser')) {
                const subfolders = ['events', 'venues', 'profile'];
                for (const subfolder of subfolders) {
                    const subfolderPath = path.join(fullPath, subfolder);
                    if (!fs.existsSync(subfolderPath)) {
                        fs.mkdirSync(subfolderPath, { recursive: true });
                        console.log(`✅ Created subfolder: ${subfolderPath}`);
                    }
                }
            }
        } else {
            console.log(`ℹ️ Folder already exists: ${fullPath}`);
        }
        
        return fullPath;
    } catch (err) {
        console.error('❌ Error creating folder structure:', err);
        throw err; // rethrow so caller knows something went wrong
    }
}

module.exports = createFolderStructure;