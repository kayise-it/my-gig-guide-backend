// routes/organiser.js
const express = require('express');
const router = express.Router();
const {
  verifyToken
} = require("../middleware/auth.middleware");

const organiserController = require("../controllers/organiser.controller");
const db = require('../models');
const Organiser = db.organiser;

const multer = require('multer');
const fs = require('fs');
const path = require('path');
const upload = multer({ storage: multer.memoryStorage() });

// In your backend (Node.js/Express example)
router.post('/upload-gallery', upload.array('gallery', 10), async (req, res) => {
  const { orgFolder } = req.body;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  if (!orgFolder) {
    return res.status(400).json({ error: 'orgFolder is required' });
  }

  try {
    // Sanitize the folder name
    const safeOrgFolder = orgFolder.replace(/\.\./g, '');

    // Correct path to frontend public directory
    const galleryPath = orgFolder;

    // Create directory if needed
    if (!fs.existsSync(galleryPath)) {
      fs.mkdirSync(galleryPath, { recursive: true, mode: 0o755 });
    }

    // Process files
    const filePaths = await Promise.all(
      req.files.map(async (file) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
        const filePath = path.join(galleryPath, uniqueName);
        
        await fs.promises.writeFile(filePath, file.buffer);
        
        return path.join('/organiser', safeOrgFolder, 'gallery', uniqueName)
          .replace(/\\/g, '/');
      })
    );

    res.status(200).json({
      success: true,
      paths: filePaths
    });

  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
router.post('/upload-poster', upload.single('poster'), async (req, res) => {
  const { orgFolder, setting_name = "poster" } = req.body;

  if (!req.file || !orgFolder) {
    return res.status(400).json({ error: 'Missing file or orgFolder' });
  }

  try {
    // Create event_poster folder within the user's directory
    const resolvedPath = path.resolve(__dirname, '..', orgFolder);
    const eventPosterPath = path.join(resolvedPath, 'event_poster');
    
    // Create directories if they don't exist
    if (!fs.existsSync(resolvedPath)) {
      fs.mkdirSync(resolvedPath, { recursive: true });
    }
    if (!fs.existsSync(eventPosterPath)) {
      fs.mkdirSync(eventPosterPath, { recursive: true });
    }

    const extension = path.extname(req.file.originalname).toLowerCase();
    const safeName = setting_name.toLowerCase().replace(/\s+/g, '_');
    const fileName = `${safeName}_${Date.now()}${extension}`;
    const fullPath = path.join(eventPosterPath, fileName);

    fs.writeFileSync(fullPath, req.file.buffer);

    const relativePath = path.join('/organiser', path.basename(orgFolder), 'event_poster', fileName);

    res.status(200).json({
      message: 'Poster uploaded',
      path: relativePath,
      fileName: fileName
    });
  } catch (error) {
    console.error('Poster upload failed:', error);
    res.status(500).json({ error: 'Failed to upload poster' });
  }
});

// Remove poster for organisers
router.delete('/remove-poster', async (req, res) => {
  try {
    const { userId, posterFilename } = req.body;

    if (!userId || !posterFilename) {
      return res.status(400).json({ error: 'Missing userId or posterFilename' });
    }

    // Get organiser data to find the folder path
    const organiser = await Organiser.findOne({
      where: { userId: userId }
    });

    if (!organiser) {
      return res.status(404).json({ error: 'Organiser not found' });
    }

    const settings = JSON.parse(organiser.settings);
    const resolvedPath = path.resolve(__dirname, '..', settings.path + settings.folder_name);
    const eventPosterPath = path.join(resolvedPath, 'event_poster', posterFilename);

    // Delete the file if it exists
    if (fs.existsSync(eventPosterPath)) {
      fs.unlinkSync(eventPosterPath);
      console.log('Deleted poster file:', eventPosterPath);
    }

    res.status(200).json({
      message: 'Poster removed successfully'
    });
  } catch (error) {
    console.error('Remove poster failed:', error);
    res.status(500).json({ error: 'Failed to remove poster' });
  }
});

//Get current organiser profile
router.get('/:id', organiserController.userOrganisation);

/* Get the organiser settings only */
router.get('/:id/settings', organiserController.getOrganiserSettings);

// Delete gallery image for organisers
router.delete('/galleryDelete/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({
        message: "Image path is required"
      });
    }

    console.log('Deleting organiser gallery image:', imagePath);

    // Convert web path to file system path
    let filePath = imagePath;
    if (imagePath.startsWith('/organiser/')) {
      // Remove leading slash and add frontend/public
      filePath = path.resolve(__dirname, '../../frontend/public', imagePath.substring(1));
    }

    // Delete the physical file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Deleted organiser file:', filePath);
    } else {
      console.log('Organiser file not found on disk:', filePath);
    }

    res.json({
      message: "Organiser gallery image deleted successfully",
      deletedImage: imagePath
    });

  } catch (err) {
    console.error("Organiser gallery delete error:", err);
    res.status(500).json({
      message: "Organiser gallery image deletion failed",
      error: err.message
    });
  }
});

module.exports = router;