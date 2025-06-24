//backend/routes/venue.routes.js
const express = require("express");
const router = express.Router();
const venueController = require("../controllers/venue.controller");
const { verifyToken } = require("../middleware/auth.middleware");


router.get('/:id', verifyToken, venueController.getVenuebyId);
router.get('/getOrganisersVenues/:id', verifyToken, venueController.getOrganisersVenues);
router.post('/createVenue', verifyToken, venueController.createVenue);
router.delete('/delete/:id', verifyToken, venueController.deleteVenue);

module.exports = router;
