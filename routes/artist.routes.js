//backend/routes/artist.routes.js
const express = require("express");
const router = express.Router();
const db = require("../models");
const artistController = require("../controllers/artist.controller");
const { getAllEventsByArtist, getAllActiveEventsByArtist, updateEventVenue } = require("../controllers/event.controller");
const { getArtistVenues } = require("../controllers/venue.controller");
const Artist = db.artist;
const { verifyToken } = require("../middleware/auth.middleware");
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// 1. Setup multer to use memory storage
const upload = multer({
    storage: multer.memoryStorage()
});
// 2. Your route with multer middleware
router.put('/uploadprofilepicture/:id', upload.single('profile_picture'), async (req, res) => {
    const destinationPath = req.body.path + "/" + req.body.folder_name; // ../frontend/public/artists/3_simba_6288

    if (!req.file) {
        return res.status(400).json({
            message: 'No file uploaded'
        });
    }

    try {
        // Ensure the destination folder exists
        const resolvedPath = path.resolve(__dirname, '..', destinationPath);
        if (!fs.existsSync(resolvedPath)) {
            fs.mkdirSync(resolvedPath, {
                recursive: true
            });
        }

        const extension = path.extname(req.file.originalname).toLowerCase();

        // Save the uploaded file manually
        const safeName = (req.body.setting_name || 'artist').toLowerCase().replace(/\s+/g, '_');
        const fileName = `${safeName}_profilepic${extension}`;
        const fullPath = path.join(resolvedPath, fileName);

        fs.writeFileSync(fullPath, req.file.buffer);

        const relativePath = `/artists/${req.body.folder_name}/${fileName}`; // relative to /public

        await Artist.update({
            profile_picture: relativePath
        }, {
            where: {
                id: req.params.id
            }
        });

        res.status(200).json({
            message: 'File uploaded successfully',
            saved_as: fileName,
            path: relativePath
        });
    } catch (error) {
        console.error('File save error:', error);
        res.status(500).json({
            message: 'Failed to save file',
            error: error.message
        });
    }
});

/* Public Routes */
router.get('/', artistController.artists);
router.get('/:id', artistController.userOrganisation);

router.get('/:artist_id', async (req, res) => {
    try {
    console.log("Received request for artist_id:", req.params.artist_id);
    const userId = req.params.artist_id;

    const artist = await Artist.findOne({
      where: { userId }
    });
    if (!artist) {
      console.log("Artist not found for userId:", userId);
      return res.status(404).json({ message: 'Artist not found' });
    }} catch (err) {
        console.error('Error fetching artist:', err);
        return res.status(500).json({ message: 'Failed to fetch artist', error: err.message });
    }
    res.status(200).json(artist);
   
});



router.put("/edit/:id", verifyToken, artistController.updateArtist);
router.put("/event/updateVenue/:id", verifyToken, updateEventVenue);
//get the events created by artist id
router.get("/events_by_artist/:id", verifyToken, getAllEventsByArtist);
router.get("/events_active_by_artist/:id", verifyToken, getAllActiveEventsByArtist);
router.get("/venues_by_artist/:id", verifyToken, getArtistVenues);


module.exports = router;