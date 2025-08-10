// File: backend/controllers/venue.controller.js
const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  validationResult
} = require('express-validator');
const venueService = require('../services/venue.service');
const Venue = db.venue;
const Artist = db.artist;
const Organiser = db.organiser;
const User = db.user;
const fs = require('fs');
const path = require('path');
const { createOrUpdateUserProfileSettings } = require('../helpers/userProfileHelper');
const createFolderStructure = require('../helpers/createFolderStructure');
const { slugify } = require('../utils/fileUtils');

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
    const paramId = parseInt(req.params.id, 10);
    if (!paramId) {
      return res.status(400).json({ message: 'Artist ID is required' });
    }

    // Resolve the owner (artist) id: accept either artist.id or user.id
    let artistOwnerId = null;

    const artistByPk = await Artist.findByPk(paramId);
    if (artistByPk) {
      artistOwnerId = artistByPk.id;
    } else {
      const artistByUser = await Artist.findOne({ where: { userId: paramId } });
      if (artistByUser) {
        artistOwnerId = artistByUser.id;
      }
    }

    if (!artistOwnerId) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    const venues = await venueService.getVenuesByOwner(artistOwnerId, 'artist');
    return res.status(200).json(venues);
  } catch (err) {
    console.error('Error fetching artist venues:', err);
    res.status(500).json({
      message: 'Failed to fetch venues',
      error: err.message
    });
  }
};

exports.getOrganisersVenues = async (req, res) => {
  try {
    const id = req.params.id;
    // Fetch venues by organiser ID
    const venues = await venueService.getOrganisersVenues(id);
    
    // Return empty array instead of 404 when no venues found
    res.status(200).json(venues || []);
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

    // Validate required fields for new structure
    if (!req.body.owner_id) {
      return res.status(400).json({
        message: "Owner ID is required"
      });
    }
    if (!req.body.owner_type || !['artist', 'organiser'].includes(req.body.owner_type)) {
      return res.status(400).json({
        message: "Owner type must be either 'artist' or 'organiser'"
      });
    }

    // Validate that the owner exists
    let ownerData;
    if (req.body.owner_type === 'artist') {
      ownerData = await Artist.findByPk(req.body.owner_id);
      if (!ownerData) {
        return res.status(400).json({
          message: "Artist not found"
        });
      }
    } else if (req.body.owner_type === 'organiser') {
      ownerData = await Organiser.findByPk(req.body.owner_id);
      if (!ownerData) {
        return res.status(400).json({
          message: "Organiser not found"
        });
      }
    }

    // Get user record
    const user = await User.findByPk(req.body.userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Use the same pattern as artist gallery upload for settings
    let settings;
    if (ownerData && ownerData.settings) {
      // Use existing folder settings
      const existingSettings = JSON.parse(ownerData.settings);
      settings = existingSettings;
    } else {
      // Generate new folder name only if no settings exist
      const role = req.body.owner_type === 'artist' ? 3 : 4;
      const folderName = `${role}_${user.username}_${Math.floor(Math.random() * 9000 + 1000)}`;
      settings = await createOrUpdateUserProfileSettings({
        role: role,
        name: user.name,
        username: user.username,
        email: user.email,
        contact_email: user.contact_email,
        phone_number: user.phone_number,
        folderName,
        userId: user.id
      });
    }

    // Create folder structure if it doesn't exist
    await createFolderStructure(settings);

    // Create venue record first
    const venueData = {
      name: req.body.name,
      location: req.body.location,
      capacity: req.body.capacity,
      contact_email: req.body.contact_email,
      phone_number: req.body.phone_number,
      website: req.body.website,
      address: req.body.address,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      userId: req.body.userId,
      owner_id: parseInt(req.body.owner_id),
      owner_type: req.body.owner_type
    };

    const createdVenue = await Venue.create(venueData);

    // Handle main picture upload using the same pattern
    let mainPicturePath = null;
    if (req.file) {
      // Create venues subfolder if it doesn't exist
      const folderPath = path.resolve(__dirname, "..", settings.path, settings.folder_name);
      const venuesPath = path.join(folderPath, 'venues');
      
      if (!fs.existsSync(venuesPath)) {
        fs.mkdirSync(venuesPath, { recursive: true });
        console.log('Created venues folder:', venuesPath);
      }

      // Create specific venue folder
      const venueFolderName = `${createdVenue.id}_${slugify(req.body.name || 'venue')}`;
      const venueFolderPath = path.join(venuesPath, venueFolderName);
      
      if (!fs.existsSync(venueFolderPath)) {
        fs.mkdirSync(venueFolderPath, { recursive: true });
        console.log('Created venue folder:', venueFolderPath);
      }

      // Save the main picture
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const fileName = `main_${Date.now()}${fileExtension}`;
      const filePath = path.join(venueFolderPath, fileName);
      
      fs.writeFileSync(filePath, req.file.buffer);
      
      // Generate public path (same pattern as artist images)
      const userType = req.body.owner_type === 'artist' ? 'artists' : 'organisers';
      mainPicturePath = `/${userType}/${settings.folder_name}/venues/${venueFolderName}/${fileName}`;
      
      try { 
        await createdVenue.update({ main_picture: mainPicturePath }); 
      } catch (e) { 
        console.warn('Failed to persist main_picture:', e.message); 
      }
    }

    res.status(201).json({
      success: true,
      message: "Venue created successfully",
      venue: createdVenue
    });
  } catch (err) {
    console.error('Error creating venue:', err);
    res.status(500).json({
      message: 'Failed to create venue',
      error: err.message
    });
  }
};

exports.updateVenue = async (req, res) => {
  try {
    const venueId = req.params.id;
    
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    // Check if venue exists
    const existingVenue = await Venue.findByPk(venueId);
    if (!existingVenue) {
      return res.status(404).json({
        message: "Venue not found"
      });
    }

    // Validate required fields for new structure
    if (!req.body.owner_id) {
      return res.status(400).json({
        message: "Owner ID is required"
      });
    }
    if (!req.body.owner_type || !['artist', 'organiser'].includes(req.body.owner_type)) {
      return res.status(400).json({
        message: "Owner type must be either 'artist' or 'organiser'"
      });
    }

    // Validate that the owner exists
    let ownerData;
    if (req.body.owner_type === 'artist') {
      ownerData = await Artist.findByPk(req.body.owner_id);
      if (!ownerData) {
        return res.status(400).json({
          message: "Artist not found"
        });
      }
    } else if (req.body.owner_type === 'organiser') {
      ownerData = await Organiser.findByPk(req.body.owner_id);
      if (!ownerData) {
        return res.status(400).json({
          message: "Organiser not found"
        });
      }
    }

    // Get user record
    const user = await User.findByPk(req.body.userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Use the same pattern as artist gallery upload for settings
    let settings;
    if (ownerData && ownerData.settings) {
      // Use existing folder settings
      const existingSettings = JSON.parse(ownerData.settings);
      settings = existingSettings;
    } else {
      // Generate new folder name only if no settings exist
      const role = req.body.owner_type === 'artist' ? 3 : 4;
      const folderName = `${role}_${user.username}_${Math.floor(Math.random() * 9000 + 1000)}`;
      settings = await createOrUpdateUserProfileSettings({
        role: role,
        name: user.name,
        username: user.username,
        email: user.email,
        contact_email: user.contact_email,
        phone_number: user.phone_number,
        folderName,
        userId: user.id
      });
    }

    // Create folder structure if it doesn't exist
    await createFolderStructure(settings);

    // Update core fields
    const venueData = {
      name: req.body.name,
      location: req.body.location,
      capacity: req.body.capacity,
      contact_email: req.body.contact_email,
      phone_number: req.body.phone_number,
      website: req.body.website,
      address: req.body.address,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      userId: req.body.userId,
      owner_id: parseInt(req.body.owner_id),
      owner_type: req.body.owner_type
    };

    await existingVenue.update(venueData);

    // Handle main picture upload if provided
    if (req.file) {
      // Create venues subfolder if it doesn't exist
      const folderPath = path.resolve(__dirname, "..", settings.path, settings.folder_name);
      const venuesPath = path.join(folderPath, 'venues');
      
      if (!fs.existsSync(venuesPath)) {
        fs.mkdirSync(venuesPath, { recursive: true });
        console.log('Created venues folder:', venuesPath);
      }

      // Create specific venue folder
      const venueFolderName = `${existingVenue.id}_${slugify(req.body.name || existingVenue.name || 'venue')}`;
      const venueFolderPath = path.join(venuesPath, venueFolderName);
      
      if (!fs.existsSync(venueFolderPath)) {
        fs.mkdirSync(venueFolderPath, { recursive: true });
        console.log('Created venue folder:', venueFolderPath);
      }

      // Save the main picture
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const fileName = `main_${Date.now()}${fileExtension}`;
      const filePath = path.join(venueFolderPath, fileName);
      
      fs.writeFileSync(filePath, req.file.buffer);
      
      // Generate public path (same pattern as artist images)
      const userType = req.body.owner_type === 'artist' ? 'artists' : 'organisers';
      const mainPicturePath = `/${userType}/${settings.folder_name}/venues/${venueFolderName}/${fileName}`;
      
      try { 
        await existingVenue.update({ main_picture: mainPicturePath }); 
      } catch (e) { 
        console.warn('Failed to persist main_picture on update:', e.message); 
      }
    }

    res.status(200).json({
      success: true,
      message: "Venue updated successfully",
      venue: existingVenue
    });
  } catch (err) {
    console.error('Error updating venue:', err);
    res.status(500).json({
      message: 'Failed to update venue',
      error: err.message
    });
  }
};

exports.uploadVenueGallery = async (req, res) => {
  try {
    const venueId = parseInt(req.params.id, 10);
    if (!venueId) return res.status(400).json({ message: 'Venue ID is required' });

    const venue = await Venue.findByPk(venueId);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Get user and owner data
    const user = await User.findByPk(venue.userId);
    const ownerData = venue.owner_type === 'artist' ? await Artist.findByPk(venue.owner_id) : await Organiser.findByPk(venue.owner_id);

    // Use the same pattern as artist gallery upload for settings
    let settings;
    if (ownerData && ownerData.settings) {
      // Use existing folder settings
      const existingSettings = JSON.parse(ownerData.settings);
      settings = existingSettings;
    } else {
      // Generate new folder name only if no settings exist
      const role = venue.owner_type === 'artist' ? 3 : 4;
      const folderName = `${role}_${user.username}_${Math.floor(Math.random() * 9000 + 1000)}`;
      settings = await createOrUpdateUserProfileSettings({
        role: role,
        name: user.name,
        username: user.username,
        email: user.email,
        contact_email: user.contact_email,
        phone_number: user.phone_number,
        folderName,
        userId: user.id
      });
    }

    // Create folder structure if it doesn't exist
    await createFolderStructure(settings);

    // Create venue gallery subfolder
    const folderPath = path.resolve(__dirname, "..", settings.path, settings.folder_name);
    const venuesPath = path.join(folderPath, 'venues');
    const venueFolderName = `${venueId}_${slugify(venue.name || 'venue')}`;
    const venueFolderPath = path.join(venuesPath, venueFolderName);
    const galleryPath = path.join(venueFolderPath, 'gallery');
    
    if (!fs.existsSync(galleryPath)) {
      fs.mkdirSync(galleryPath, { recursive: true });
      console.log('Created venue gallery folder:', galleryPath);
    }

    // Get current gallery from database
    let currentGallery = [];
    if (venue.venue_gallery) {
      try {
        currentGallery = JSON.parse(venue.venue_gallery);
        console.log('Current venue gallery from DB:', currentGallery);
      } catch (e) {
        console.error('Error parsing existing venue gallery:', e);
        currentGallery = [];
      }
    } else {
      console.log('No existing venue gallery found, starting with empty array');
    }

    const uploadedFiles = [];
    const errors = [];

    // Process each uploaded file (same pattern as artist gallery)
    console.log('Starting to process', req.files.length, 'venue gallery files');
    for (const file of req.files) {
      try {
        console.log('Processing venue gallery file:', file.originalname);
        const { originalname, mimetype, size, buffer } = file;

        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(mimetype)) {
          errors.push(`Invalid file type for ${originalname}. Please upload an image (JPEG, PNG, GIF, or WebP).`);
          continue;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (size > maxSize) {
          errors.push(`File ${originalname} is too large. Maximum size is 5MB.`);
          continue;
        }

        // Generate unique filename
        const fileExtension = path.extname(originalname).toLowerCase();
        const timestamp = Date.now();
        const uniqueId = Math.random().toString(36).substring(2, 15);
        const fileName = `gallery_${timestamp}_${uniqueId}${fileExtension}`;

        // Save file to gallery folder
        const filePath = path.join(galleryPath, fileName);
        fs.writeFileSync(filePath, buffer);

        // Generate public URL (same pattern as artist gallery)
        const userType = venue.owner_type === 'artist' ? 'artists' : 'organisers';
        const publicUrl = `/${userType}/${settings.folder_name}/venues/${venueFolderName}/gallery/${fileName}`;
        
        currentGallery.push(publicUrl);
        uploadedFiles.push({
          fileName,
          originalName: originalname,
          url: publicUrl,
          size
        });

        console.log(`Venue gallery file uploaded successfully: ${fileName}`);
      } catch (fileError) {
        console.error(`Error processing venue gallery file ${file.originalname}:`, fileError);
        errors.push(`Failed to upload ${file.originalname}: ${fileError.message}`);
      }
    }

    // Update venue gallery in database
    try {
      await venue.update({
        venue_gallery: JSON.stringify(currentGallery)
      });
      console.log('Venue gallery updated in database:', currentGallery);
    } catch (dbError) {
      console.error('Error updating venue gallery in database:', dbError);
      return res.status(500).json({
        message: 'Failed to update venue gallery in database',
        error: dbError.message
      });
    }

    return res.status(200).json({
      message: uploadedFiles.length > 0 ? 
        `Successfully uploaded ${uploadedFiles.length} venue gallery image(s)` : 
        'No venue gallery images were uploaded',
      uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
      gallery: currentGallery
    });
  } catch (err) {
    console.error('Venue gallery upload error:', err);
    return res.status(500).json({ 
      message: 'Venue gallery upload failed', 
      error: err.message 
    });
  }
};

exports.deleteVenueGalleryImage = async (req, res) => {
  try {
    const venueId = parseInt(req.params.id, 10);
    const { imagePath } = req.body;
    if (!venueId) return res.status(400).json({ message: 'Venue ID is required' });
    if (!imagePath) return res.status(400).json({ message: 'imagePath is required' });

    const venue = await Venue.findByPk(venueId);
    if (!venue) return res.status(404).json({ message: 'Venue not found' });

    let currentGallery = [];
    if (venue.venue_gallery) {
      try { currentGallery = JSON.parse(venue.venue_gallery) || []; } catch (_) { currentGallery = []; }
    }

    const idx = currentGallery.indexOf(imagePath);
    if (idx === -1) return res.status(404).json({ message: 'Image not in gallery' });

    // Try delete file from disk (resolve relative to frontend/public)
    try {
      const fullPath = path.resolve(__dirname, '../../frontend/public', imagePath.replace(/^\//, ''));
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch (fileErr) {
      console.warn('Failed to delete gallery file:', fileErr.message);
    }

    currentGallery.splice(idx, 1);
    await venue.update({ venue_gallery: JSON.stringify(currentGallery) });

    return res.status(200).json({ message: 'Venue gallery image removed', gallery: currentGallery });
  } catch (err) {
    console.error('Venue gallery delete error:', err);
    return res.status(500).json({ message: 'Failed to delete venue gallery image', error: err.message });
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