// File: backend/controllers/venue.controller.js
const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  validationResult
} = require('express-validator');
const venueService = require('../services/venue.service');
const Venue = db.venue;

exports.getVenuebyId = async (req, res) => {
  const venueId = req.params.id;

  try {
    const venue = await venueService.getVenuebyId(venueId);

    console.log("Venue:", venue);
    if (!venue) {
      return res.status(200).json({
        success: false,
        message: 'Venue not found',
      });
    }

    res.status(200).json({
      success: true,
      venue,
    });
  } catch (error) {
    console.error('Error fetching venue by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching venue',
    });
  }
};

exports.getArtistVenues = async (req, res) => {
  try {
    const venues = await venueService.getAllVenues();
    res.status(200).json(venues); // Even if it's empty
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch venues',
      error: err.message
    });
  }
};

exports.getOrganisersVenues = async (req, res) => {
  try {

    id = req.params.id;
    // Fetch venues by organiser ID
    const venues = await venueService.getOrganisersVenues(id);
    
    if (!venues || venues.length === 0) {
      return res.status(404).json({
        message: 'No venues found for this organiser'
      });
    } else {
      res.status(200).json(venues);
    }
  } catch (err) {
    res.status(500).json({
      message: 'Failed to fetch venues',
      error: err.message
    });
  }
};
exports.createVenue = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }
    // Create a new venue
    const venue = await Venue.create(req.body);    

    // Return the created venue
    res.status(201).json(venue);
  } catch (err) {
    console.error('Error creating venue:', err);
    res.status(500).json({
      message: 'Failed to create venue',
      error: err.message
    });
  }
};

exports.deleteVenue = async (req, res) => {
  const venueId = req.params.id;

  try {
    // Check if the venue exists
    const venue = await Venue.findByPk(venueId);
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found',
      });
    }

    // Delete the venue
    await venue.destroy();

    res.status(200).json({
      success: true,
      message: 'Venue deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting venue:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting venue',
    });
  }
};