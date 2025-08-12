// File: backend/controllers/event.controller.js
const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require('express-validator');
const Event = db.event;
const User = db.user;
const Artist = db.artist;
const Organiser = db.organiser;
const { Op } = require("sequelize"); // Make sure this is imported at the top of your file


exports.events = async (req, res) => {
  try {
    // Try to fetch all events from the database with owner information
    const events = await Event.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "username"],
          as: 'creator'
        },
        {
          model: Artist,
          attributes: ["id", "stage_name", "real_name"],
          as: 'artistOwner'
        },
        {
          model: Organiser,
          attributes: ["id", "name"],
          as: 'organiserOwner'
        },
        {
          model: db.venue,
          attributes: ["id", "name", "address", "latitude", "longitude"],
          as: 'venue'
        }
      ]
    });
    
    // Return the list of events (empty array if no events found)
    res.status(200).json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    // Return empty array instead of error to prevent frontend from breaking
    res.status(200).json([]);
  }
};
exports.createEvent = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Create a new event
    const event = await Event.create(req.body);

    // Return the created event
    res.status(201).json(event);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Failed to create event', error: err.message });
  }
};
exports.getEventById = async (req, res) => {
  try {
    // Find event by ID with owner information
    const event = await Event.findByPk(req.params.id, {
      include: [
        {
          model: User,
          attributes: ["id", "username"],
          as: 'creator'
        },
        {
          model: Artist,
          attributes: ["id", "stage_name", "real_name"],
          as: 'artistOwner'
        },
        {
          model: Organiser,
          attributes: ["id", "name"],
          as: 'organiserOwner'
        }
      ]
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Return the event
    res.status(200).json(event);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ message: 'Failed to fetch event', error: err.message });
  }
};
exports.updateEvent = async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find event by ID
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update the event
    await event.update(req.body);

    // Return the updated event
    res.status(200).json(event);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ message: 'Failed to update event', error: err.message });
  }
};
exports.deleteEvent = async (req, res) => {
  try {
    // Find event by ID ACL[1,2,3]
    const event = await Event.findByPk(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Delete the event
    await event.destroy();

    // Return success message
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Failed to delete event', error: err.message });
  }
};
// Function to get all events for a specific organiser
exports.getAllEventsByOrganiser = async (req, res) => {
  try {
    const userId = req.user.userId; // Assuming you are using JWT and have user info in req.user

    // First get the organiser ID for this user
    const organiser = await Organiser.findOne({
      where: { userId: userId }
    });

    if (!organiser) {
      return res.status(404).json({ message: 'Organiser not found for this user' });
    }

    const events = await Event.findAll({
      where: { 
        owner_id: organiser.id,
        owner_type: 'organiser'
      },
      include: [
        {
          model: User,
          attributes: ["id", "username"],
          as: 'creator'
        },
        {
          model: Organiser,
          attributes: ["id", "name"],
          as: 'organiserOwner'
        }
      ],
    });
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching organiser events:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};
// Function to get all events for a specific artist
exports.getAllEventsByArtist = async (req, res) => {
    try {
    const userId = req.user.id; // Assuming you are using JWT and have user info in req.user

    // First get the artist ID for this user
    const artist = await Artist.findOne({
      where: { userId: userId }
    });

    if (!artist) {
      return res.status(404).json({ message: 'Artist not found for this user' });
    }

    const events = await Event.findAll({
      where: { 
        owner_id: artist.id,
        owner_type: 'artist'
      },
      include: [
        {
          model: User,
          attributes: ["id", "username"],
          as: 'creator'
        },
        {
          model: Artist,
          attributes: ["id", "stage_name", "real_name"],
          as: 'artistOwner'
        }
      ],
    });
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching artist events:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};
// Function to get all events for a specific artist that have not passed. if date is greater than current date
exports.getAllActiveEventsByArtist = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming JWT middleware adds user info to req.user

    // First get the artist ID for this user
    const artist = await Artist.findOne({
      where: { userId: userId }
    });

    if (!artist) {
      return res.status(404).json({ message: 'Artist not found for this user' });
    }

    const events = await Event.findAll({
      where: {
        owner_id: artist.id,
        owner_type: 'artist',
        date: {
          [Op.gt]: new Date(), // Only get events with a future date
        },
      },
      include: [
        {
          model: User,
          attributes: ["id", "username"],
          as: 'creator'
        },
        {
          model: Artist,
          attributes: ["id", "stage_name", "real_name"],
          as: 'artistOwner'
        }
      ],
    });

    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching artist events:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
};

//Update the venue
exports.updateEventVenue = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { venue_id } = req.body;

    // Find the event
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Update venue_id
    event.venue_id = venue_id;
    await event.save();

    res.status(200).json({ message: 'Event venue updated successfully', event });
  } catch (error) {
    console.error('Error updating event venue:', error);
    res.status(500).json({ message: 'Failed to update event venue', error: error.message });
  }
};