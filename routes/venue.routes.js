//backend/routes/venue.routes.js
const express = require("express");
const router = express.Router();
const venueController = require("../controllers/venue.controller");
const { verifyToken } = require("../middleware/auth.middleware");
const multer = require('multer');

// Use memory storage; controller will persist to disk
const upload = multer({ storage: multer.memoryStorage() });

// List all venues with search, filtering, and pagination
router.get('/', verifyToken, async (req, res) => {
  try {
    const { 
      search = '', 
      location = '', 
      capacity_min = 0, 
      capacity_max = 10000, 
      page = 1, 
      limit = 20,
      user_role = '',
      user_id = ''
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // Add search functionality (using LIKE for MySQL compatibility)
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { name: { [require('sequelize').Op.like]: `%${search}%` } },
        { location: { [require('sequelize').Op.like]: `%${search}%` } },
        { description: { [require('sequelize').Op.like]: `%${search}%` } }
      ];
    }

    // Add location filter
    if (location) {
      whereClause.location = { [require('sequelize').Op.like]: `%${location}%` };
    }

    // Add capacity filter
    if (capacity_min || capacity_max) {
      whereClause.capacity = {
        [require('sequelize').Op.between]: [parseInt(capacity_min), parseInt(capacity_max)]
      };
    }

    // Get all venues with owner information
    const { count, rows: rawVenues } = await require('../models').venue.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: require('../models').artist,
          as: 'artistOwner',
          required: false,
          include: [{
            model: require('../models').user,
            as: 'user',
            attributes: ['username', 'email']
          }]
        },
        {
          model: require('../models').organiser,
          as: 'organiserOwner', 
          required: false,
          include: [{
            model: require('../models').user,
            as: 'user',
            attributes: ['username', 'email']
          }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Add ownership information and determine if user owns venue
    const venues = rawVenues.map(venue => {
      const venueData = venue.toJSON();
      
      // Determine owner information
      let owner = null;
      let isOwnVenue = false;
      
      if (venueData.owner_type === 'artist' && venueData.artistOwner) {
        owner = {
          type: 'artist',
          id: venueData.artistOwner.id,
          name: venueData.artistOwner.stage_name || venueData.artistOwner.user?.username,
          email: venueData.artistOwner.user?.email
        };
        // Check if current user owns this venue (for artists, match artist ID)
        isOwnVenue = user_role === 'artist' && venueData.owner_id.toString() === user_id.toString();
      } else if (venueData.owner_type === 'organiser' && venueData.organiserOwner) {
        owner = {
          type: 'organiser',
          id: venueData.organiserOwner.id,
          name: venueData.organiserOwner.name || venueData.organiserOwner.user?.username,
          email: venueData.organiserOwner.user?.email
        };
        // Check if current user owns this venue (for organisers, match organiser ID)
        isOwnVenue = user_role === 'organiser' && venueData.owner_id.toString() === user_id.toString();
      }

      return {
        ...venueData,
        owner,
        isOwnVenue,
        // Remove the included models to clean up response
        artistOwner: undefined,
        organiserOwner: undefined
      };
    });

    // Sort venues: user's own venues first, then others
    const sortedVenues = venues.sort((a, b) => {
      if (a.isOwnVenue && !b.isOwnVenue) return -1;
      if (!a.isOwnVenue && b.isOwnVenue) return 1;
      return 0; // Keep original order for venues of same ownership status
    });

    return res.status(200).json({
      success: true,
      venues: sortedVenues,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch venues', error: err.message });
  }
});

// Public route for viewing venue details (no authentication required)
router.get('/public/:id', venueController.getVenuebyId);
// Private route for authenticated users
router.get('/:id', verifyToken, venueController.getVenuebyId);
router.get('/getOrganisersVenues/:id', verifyToken, venueController.getOrganisersVenues);
router.get('/getArtistVenues/:id', verifyToken, venueController.getArtistVenues);
router.post('/createVenue', verifyToken, upload.single('main_picture'), venueController.createVenue);
router.put('/updateVenue/:id', verifyToken, upload.single('main_picture'), venueController.updateVenue);
router.put('/uploadGallery/:id', verifyToken, upload.array('venue_gallery', 12), venueController.uploadVenueGallery);
router.delete('/deleteGalleryImage/:id', verifyToken, venueController.deleteVenueGalleryImage);
router.delete('/delete/:id', verifyToken, venueController.deleteVenue);

module.exports = router;
