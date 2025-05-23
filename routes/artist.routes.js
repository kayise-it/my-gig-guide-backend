//backend/routes/artist.routes.js
const express = require("express");
const router = express.Router();
const artistController = require("../controllers/artist.controller");
const {getAllEventsByArtist, getAllActiveEventsByArtist, updateEventVenue} = require("../controllers/event.controller");
const {getArtistVenues} = require("../controllers/venue.controller");

const {
  verifyToken
} = require("../middleware/auth.middleware");
// Using multer for file uploads
const multer = require('multer');
const upload = multer({
  dest: 'uploads/'
});
const Artist = require("../models").artist;




const path = require('path');
const fs = require('fs');

router.put('/uploadprofilepicture/:id', upload.single('profile_picture'), async (req, res) => {
  console.log("Request Body:", req.body);
  console.log("Request File:", req.file);

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  res.status(200).json({ message: "File uploaded successfully" });
});

router.get("/:id", artistController.getArtistById);
router.put("/edit/:id", artistController.updateArtist);
router.put("/event/updateVenue/:id", updateEventVenue);
//get the events created by artist id
router.get("/events_by_artist/:id", verifyToken, getAllEventsByArtist);
router.get("/events_active_by_artist/:id", verifyToken, getAllActiveEventsByArtist);
router.get("/venues_by_artist/:id", verifyToken, getArtistVenues);
router.get("/:id", artistController.getArtistById);
module.exports = router;