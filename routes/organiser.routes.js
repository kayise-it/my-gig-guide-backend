// routes/organiser.js
const express = require('express');
const router = express.Router();
const {
  verifyToken
} = require("../middleware/auth.middleware");

const organiserController = require("../controllers/organiser.controller");
const db = require('../models');

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
    const resolvedPath = path.resolve(__dirname, '..', orgFolder);
    if (!fs.existsSync(resolvedPath)) {
      fs.mkdirSync(resolvedPath, { recursive: true });
    }

    const extension = path.extname(req.file.originalname).toLowerCase();
    const safeName = setting_name.toLowerCase().replace(/\s+/g, '_');
    const fileName = `${safeName}_${Date.now()}${extension}`;
    const fullPath = path.join(resolvedPath, fileName);

    fs.writeFileSync(fullPath, req.file.buffer);

    const relativePath = path.join('/organiser', path.basename(orgFolder), fileName);

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

//Get current organiser profile
router.get('/:id', organiserController.userOrganisation);

/* Get the organiser settings only */
router.get('/:id/settings', organiserController.getOrganiserSettings);

module.exports = router;