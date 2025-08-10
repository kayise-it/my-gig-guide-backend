//backend/routes/artist.routes.js
const express = require("express");
const router = express.Router();
const db = require("../models");
const createOrUpdateUserProfileSettings = require('../helpers/userProfileHelper');
const artistController = require("../controllers/artist.controller");
const {
    getAllEventsByArtist,
    getAllActiveEventsByArtist,
    updateEventVenue
} = require("../controllers/event.controller");
const {
    getArtistVenues
} = require("../controllers/venue.controller");
const Artist = db.artist;
const {
    verifyToken
} = require("../middleware/auth.middleware");
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// 1. Setup multer to use memory storage
const upload = multer({
    storage: multer.memoryStorage()
});
// 2. Your route with multer middleware

router.put('/uploadprofilepicture/:id', verifyToken, upload.single('profile_picture'), artistController.uploadProfilePicture);
router.delete('/uploadprofilepicture/:id', verifyToken, artistController.deleteProfilePicture);
router.put('/galleryUpload/:id', verifyToken, upload.array('gallery_images', 10), artistController.uploadGalleryImages);
router.post('/uploadGalleryImages/:id', verifyToken, upload.array('gallery_images', 10), artistController.uploadGalleryImages);
router.put('/galleryUploadSingle/:id', verifyToken, upload.single('gallery_image'), artistController.uploadGalleryImage);
router.delete('/galleryDelete/:id', verifyToken, artistController.deleteGalleryImage);
router.delete('/deleteGalleryImage/:id', verifyToken, artistController.deleteGalleryImage);

// Upload poster for artists
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

    const relativePath = path.join('/artists', path.basename(orgFolder), 'event_poster', fileName);

    res.status(200).json({
      message: 'Poster uploaded',
      path: relativePath,
      fileName: fileName,
      posterFilename: fileName
    });
  } catch (error) {
    console.error('Poster upload failed:', error);
    res.status(500).json({ error: 'Failed to upload poster' });
  }
});

// Upload gallery for artists
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
        
        return path.join('/artists', safeOrgFolder, 'gallery', uniqueName)
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

// Remove poster for artists
router.delete('/remove-poster', async (req, res) => {
  try {
    const { userId, posterFilename } = req.body;

    if (!userId || !posterFilename) {
      return res.status(400).json({ error: 'Missing userId or posterFilename' });
    }

    // Get artist data to find the folder path
    const artist = await Artist.findOne({
      where: { userId: userId }
    });

    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    const settings = JSON.parse(artist.settings);
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

/* Public Routes */
router.get('/', artistController.artists);
router.get('/:id', artistController.userOrganisation);

router.put('/edit/:id', verifyToken, artistController.updateArtist);

router.put("/event/updateVenue/:id", verifyToken, updateEventVenue);
//get the events created by artist id
router.get("/events_by_artist/:id", verifyToken, getAllEventsByArtist);
router.get("/events_active_by_artist/:id", verifyToken, getAllActiveEventsByArtist);
router.get("/venues_by_artist/:id", verifyToken, getArtistVenues);

// Test endpoint to add sample gallery images
router.post('/test/add-sample-gallery/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get artist data
    const artist = await Artist.findOne({
      where: { userId: userId }
    });

    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    // Parse settings
    let settings;
    if (artist.settings) {
      settings = JSON.parse(artist.settings);
    } else {
      return res.status(400).json({ message: 'Artist settings not found' });
    }

    // Create sample gallery paths
    const sampleImages = [
      'https://picsum.photos/400/400?random=1',
      'https://picsum.photos/400/400?random=2',
      'https://picsum.photos/400/400?random=3',
      'https://picsum.photos/400/400?random=4'
    ];

    // Update artist gallery
    await artist.update({
      gallery: JSON.stringify(sampleImages)
    });

    res.json({
      message: 'Sample gallery images added',
      gallery: sampleImages
    });

  } catch (error) {
    console.error('Error adding sample gallery:', error);
    res.status(500).json({ message: 'Failed to add sample gallery' });
  }
});

// Test endpoint to check current gallery
router.get('/test/check-gallery/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Get artist data
    const artist = await Artist.findOne({
      where: { userId: userId }
    });

    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    let gallery = [];
    if (artist.gallery) {
      try {
        gallery = JSON.parse(artist.gallery);
      } catch (e) {
        gallery = [];
      }
    }

    res.json({
      message: 'Current gallery retrieved',
      gallery: gallery,
      galleryCount: gallery.length,
      rawGallery: artist.gallery
    });

  } catch (error) {
    console.error('Error checking gallery:', error);
    res.status(500).json({ message: 'Failed to check gallery' });
  }
});

module.exports = router;