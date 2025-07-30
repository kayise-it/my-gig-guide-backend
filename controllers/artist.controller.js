// File: backend/controllers/artist.controller.js
const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  validationResult
} = require('express-validator');
const {
  changeFolderName
} = require("../utils/changeFolderName");
const Artist = db.artist;

//Access control list to delete the event ACL[1,2,3]
exports.deleteArtist = async (req, res) => {
  try {
    const artistId = req.params.id;

    // Check if the artist exists
    const artist = await Artist.findByPk(artistId);
    if (!artist) {
      return res.status(404).json({
        message: 'Artist not 134found'
      });
    }

    // Delete the artist
    await Artist.destroy({
      where: {
        id: artistId
      }
    });

    res.status(200).json({
      message: 'Artist deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting artist:', err);
    res.status(500).json({
      message: 'Failed to delete artist',
      error: err.message
    });
  }
};
exports.artists = async (req, res) => {
  try {
    // Try to fetch all artists from the database
    const artists = await Artist.findAll();

    if (artists.length === 0) {
      return res.status(404).json({
        message: 'No artists found'
      });
    }

    // If found, return the list of artists
    res.status(200).json(artists);
  } catch (err) {
    console.error('Error fetching artists:', err);
    res.status(500).json({
      message: 'Failed to fetch artists',
      error: err.message
    });
  }
};
//get Artist by id
exports.getArtistById = async (req, res) => {
  try {
    console.log("Received request for artist_id:", req.params.artist_id);
    const userId = req.params.artist_id;

    console.log("Querying database with userId:", userId);
    const artist = await Artist.findOne({
      where: {
        userId
      }
    });

    if (!artist) {
      console.log("Artist not fr2ound for userId:", userId);
      return res.status(404).json({
        message: 'Artist notasd found'
      });
    }

    console.log("Found artist:", artist);
    res.status(200).json(artist);
  } catch (err) {
    console.error('Error fetching artist:', err);
    res.status(500).json({
      message: 'Failed to fetch artist',
      error: err.message
    });
  }
};

// Update the artist
exports.updateArtist = async (req, res) => {
  try {
    // ✅ Get userId from auth middleware (req.user.id)
    const userId = req.user?.id; 

    // ❌ If no user is authenticated, throw an error
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: No user ID found" });
    }

    // ✅ Update artist where userId matches
    const [updated] = await Artist.update(req.body, {
      where: { userId: userId }
    });

    if (!updated) {
      return res.status(404).json({ error: "Artist not found" });
    }

    const updatedArtist = await Artist.findOne({ where: { userId } });
    return res.json(updatedArtist);

  } catch (error) {
    console.error("Error updating artist:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
// We have set up a directory structure for uploading profile pictures. The folder path is “uploads/artist/{id}_{name}”, where {id} is the artist’s unique ID, and {name} is the artist’s name. Uploaded images are stored in this directory.
// The artist's profile picture is updated in the database with the new image path.
exports.uploadProfilePicture = async (req, res) => {
  console.log(req.body);
};
exports.userOrganisation = async (req, res) => {
  try {
    const userId = req.params.id;
    const artist = await Artist.findOne({
      where: {
        userId: userId
      }
    });

    if (!artist) {
      return res.status(404).json({
        message: 'artist not found'
      });
    }

    res.status(200).json(artist);
  } catch (err) {
    console.error('Error fetching artist:', err);
    res.status(500).json({
      message: 'Failed to fetch artist',
      error: err.message
    });
  }
}