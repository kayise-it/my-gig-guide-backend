// File: backend/controllers/artist.controller.js
const db = require("../models");
const Artist = db.artist;
const User = db.user;
const { createOrUpdateUserProfileSettings } = require('../helpers/userProfileHelper');
const { createFolderStructure } = require('../utils/fileUtils');
const fs = require('fs');
const path = require('path');

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
      return res.status(401).json({
        error: "Unauthorized: No user ID found"
      });
    }

    // ✅ Update artist where userId matches
    const [updated] = await Artist.update(req.body, {
      where: {
        userId: userId
      }
    });

    if (!updated) {
      return res.status(404).json({
        error: "Artist not found"
      });
    }

    const updatedArtist = await Artist.findOne({
      where: {
        userId
      }
    });
    return res.json(updatedArtist);

  } catch (error) {
    console.error("Error updating artist:", error);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
};
// We have set up a directory structure for uploading profile pictures. The folder path is "uploads/artist/{id}_{name}", where {id} is the artist's unique ID, and {name} is the artist's name. Uploaded images are stored in this directory.
// Upload multiple gallery images for an artist
exports.uploadGalleryImages = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "No files uploaded. Please select at least one image."
      });
    }

    console.log('Uploaded gallery files:', req.files);
    console.log('Number of files received:', req.files.length);
    console.log('File names:', req.files.map(f => f.originalname));
    
    // Get user and artist details
    const user = await User.findByPk(userId);
    if (!user || user.role !== 3) {
      return res.status(404).json({
        message: "Artist not found"
      });
    }

    // Check if artist already has a profile and folder settings
    const existingArtist = await Artist.findOne({
      where: {
        userId: user.id
      }
    });

    let settings;
    if (existingArtist && existingArtist.settings) {
      // Use existing folder settings
      const existingSettings = JSON.parse(existingArtist.settings);
      settings = existingSettings;
    } else {
      // Generate new folder name only if no settings exist
      const folderName = `${user.role}_${user.username}_${Math.floor(Math.random() * 9000 + 1000)}`;
      settings = await createOrUpdateUserProfileSettings({
        role: user.role,
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

    // Create gallery subfolder if it doesn't exist
    const folderPath = path.resolve(__dirname, "..", settings.path, settings.folder_name);
    const galleryPath = path.join(folderPath, 'gallery');
    
    // Ensure all artist subfolders exist (events, venues, profile, gallery)
    const { createArtistSubfolders } = require("../helpers/userProfileHelper");
    createArtistSubfolders(folderPath);
    
    if (!fs.existsSync(galleryPath)) {
      fs.mkdirSync(galleryPath, { recursive: true });
      console.log('Created gallery folder:', galleryPath);
    }

    // Get current gallery from database
    let currentGallery = [];
    if (existingArtist && existingArtist.gallery) {
      try {
        currentGallery = JSON.parse(existingArtist.gallery);
        console.log('Current gallery from DB:', currentGallery);
      } catch (e) {
        console.error('Error parsing existing gallery:', e);
        currentGallery = [];
      }
    } else {
      console.log('No existing gallery found, starting with empty array');
    }

    const uploadedFiles = [];
    const errors = [];

    // Process each uploaded file
    console.log('Starting to process', req.files.length, 'files');
    for (const file of req.files) {
      try {
        console.log('Processing file:', file.originalname);
        const {
          originalname,
          mimetype,
          size,
          buffer
        } = file;

        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(mimetype)) {
          errors.push(`Invalid file type for ${originalname}. Please upload an image (JPEG, PNG, GIF, or WebP).`);
          continue;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (size > maxSize) {
          errors.push(`File ${originalname} too large. Please upload an image smaller than 5MB.`);
          continue;
        }

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `gallery_${timestamp}_${originalname}`;

        // Save the file to gallery folder
        const filePath = path.join(galleryPath, filename);
        fs.writeFileSync(filePath, buffer);
        console.log('Gallery file saved to:', filePath);

        // Get the public web path for database storage (not file system path)
        const galleryImagePath = `/artists/${settings.folder_name}/gallery/${filename}`;

        // Add new image to gallery array
        currentGallery.push(galleryImagePath);
        console.log('Added to gallery array:', galleryImagePath);
        console.log('Current gallery length:', currentGallery.length);

        uploadedFiles.push({
          originalName: originalname,
          galleryPath: galleryImagePath,
          size: size,
          mimeType: mimetype
        });

      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        errors.push(`Failed to process ${file.originalname}: ${fileError.message}`);
      }
    }

    // Update the database with all new images at once
    if (uploadedFiles.length > 0) {
      console.log('Updating gallery in DB with:', currentGallery);
      await existingArtist.update({
        gallery: JSON.stringify(currentGallery)
      });
      console.log('Gallery updated successfully in database');
    }

    res.json({
      message: uploadedFiles.length > 0 ? "Gallery images uploaded successfully" : "No images were uploaded",
      uploadedFiles: uploadedFiles,
      totalUploaded: uploadedFiles.length,
      errors: errors,
      gallery: currentGallery,
      debug: {
        filesReceived: req.files.length,
        filesProcessed: uploadedFiles.length,
        errorsCount: errors.length
      }
    });

  } catch (err) {
    console.error("Gallery upload error:", err);
    res.status(500).json({
      message: "Gallery image upload failed",
      error: err.message
    });
  }
}

// Single gallery image upload (for backward compatibility)
exports.uploadGalleryImage = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded. Please select an image."
      });
    }

    console.log('Uploaded gallery file:', req.file);
    
    // Get file details from multer
    const {
      originalname,
      mimetype,
      size,
      buffer
    } = req.file;

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(mimetype)) {
      return res.status(400).json({
        message: "Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)."
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (size > maxSize) {
      return res.status(400).json({
        message: "File too large. Please upload an image smaller than 5MB."
      });
    }

    // Get user and artist details
    const user = await User.findByPk(userId);
    if (!user || user.role !== 3) {
      return res.status(404).json({
        message: "Artist not found"
      });
    }

    // Check if artist already has a profile and folder settings
    const existingArtist = await Artist.findOne({
      where: {
        userId: user.id
      }
    });

    let settings;
    if (existingArtist && existingArtist.settings) {
      // Use existing folder settings
      const existingSettings = JSON.parse(existingArtist.settings);
      settings = existingSettings;
    } else {
      // Generate new folder name only if no settings exist
      const folderName = `${user.role}_${user.username}_${Math.floor(Math.random() * 9000 + 1000)}`;
      settings = await createOrUpdateUserProfileSettings({
        role: user.role,
        name: user.name,
        username: user.username,
        email: user.email,
        contact_email: user.contact_email,
        phone_number: user.phone_number,
        folderName,
        userId: user.id
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `gallery_${timestamp}_${originalname}`;

    // Create folder structure if it doesn't exist
    await createFolderStructure(settings);

    // Create gallery subfolder if it doesn't exist
    const folderPath = path.resolve(__dirname, "..", settings.path, settings.folder_name);
    const galleryPath = path.join(folderPath, 'gallery');
    
    // Ensure all artist subfolders exist (events, venues, profile, gallery)
    const { createArtistSubfolders } = require("../helpers/userProfileHelper");
    createArtistSubfolders(folderPath);
    
    if (!fs.existsSync(galleryPath)) {
      fs.mkdirSync(galleryPath, { recursive: true });
      console.log('Created gallery folder:', galleryPath);
    }

    // Save the file to gallery folder
    const filePath = path.join(galleryPath, filename);
    fs.writeFileSync(filePath, buffer);
    console.log('Gallery file saved to:', filePath);

    // Get the relative path for database storage
    const galleryImagePath = `${settings.path}${settings.folder_name}/gallery/${filename}`;

    // Use database transaction to prevent race conditions
    const result = await db.sequelize.transaction(async (t) => {
      // Reload artist data within transaction to get latest gallery
      const artistInTransaction = await Artist.findOne({
        where: { userId: user.id },
        transaction: t,
        lock: true
      });

      let currentGallery = [];
      if (artistInTransaction && artistInTransaction.gallery) {
        try {
          currentGallery = JSON.parse(artistInTransaction.gallery);
        } catch (e) {
          currentGallery = [];
        }
      }

      // Add new image to gallery
      currentGallery.push(galleryImagePath);

      // Update artist's gallery in database
      await artistInTransaction.update({
        gallery: JSON.stringify(currentGallery)
      }, { transaction: t });

      return currentGallery;
    });

    res.json({
      message: "Gallery image uploaded successfully",
      gallery_image: galleryImagePath,
      gallery: result,
      fileInfo: {
        originalName: originalname,
        size: size,
        mimeType: mimetype
      }
    });

  } catch (err) {
    console.error("Gallery upload error:", err);
    res.status(500).json({
      message: "Gallery image upload failed",
      error: err.message
    });
  }
}

// Delete gallery image
exports.deleteGalleryImage = async (req, res) => {
  try {
    const userId = req.params.id;
    const { imagePath } = req.body; // Image path to delete

    console.log('DELETE request received for userId:', userId);
    console.log('Request body:', req.body);
    console.log('Image path from request:', imagePath);

    if (!imagePath) {
      return res.status(400).json({
        message: "Image path is required"
      });
    }

    console.log('Deleting gallery image:', imagePath);

    // Get user and artist details
    const user = await User.findByPk(userId);
    if (!user || user.role !== 3) {
      return res.status(404).json({
        message: "Artist not found"
      });
    }

    // Get artist data
    const artist = await Artist.findOne({
      where: { userId: user.id }
    });

    if (!artist) {
      return res.status(404).json({
        message: "Artist profile not found"
      });
    }

    // Parse current gallery
    let currentGallery = [];
    if (artist.gallery) {
      try {
        currentGallery = JSON.parse(artist.gallery);
      } catch (e) {
        currentGallery = [];
      }
    }

    // Find the image in the gallery array
    const imageIndex = currentGallery.findIndex(img => img === imagePath);
    if (imageIndex === -1) {
      console.log('Image not found in gallery array. Current gallery:', currentGallery);
      console.log('Looking for image path:', imagePath);
      return res.status(404).json({
        message: "Image not found in gallery",
        searchedPath: imagePath,
        currentGallery: currentGallery
      });
    }

    // Remove image from gallery array
    currentGallery.splice(imageIndex, 1);

    // Delete the physical file
    try {
      // Convert web path to file system path
      let filePath = imagePath;
      
      console.log('Original imagePath:', imagePath);
      console.log('Current directory:', __dirname);
      
      if (imagePath.startsWith('/')) {
        // Remove leading slash and add frontend/public
        filePath = path.resolve(__dirname, '../../frontend/public', imagePath.substring(1));
        console.log('Resolved file path (from /):', filePath);
      } else if (imagePath.startsWith('../frontend/public/')) {
        // Convert relative path to absolute
        filePath = path.resolve(__dirname, '../..', imagePath);
        console.log('Resolved file path (from ../frontend/public/):', filePath);
      } else {
        // Try to resolve as relative path
        filePath = path.resolve(__dirname, '../../frontend/public', imagePath);
        console.log('Resolved file path (relative):', filePath);
      }

      console.log('Final file path to check:', filePath);
      console.log('File exists check:', fs.existsSync(filePath));
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('✅ Successfully deleted file:', filePath);
      } else {
        console.log('❌ File not found at:', filePath);
        
        // Try multiple alternative path resolutions
        const alternativePaths = [
          path.resolve(__dirname, '../frontend/public', imagePath.replace('../frontend/public/', '')),
          path.resolve(__dirname, '../../frontend/public', imagePath.replace('../frontend/public/', '')),
          path.resolve(__dirname, '../..', imagePath),
          path.resolve(__dirname, '../../frontend/public', imagePath.replace('/', '')),
        ];
        
        let fileDeleted = false;
        for (const altPath of alternativePaths) {
          console.log('Trying alternative path:', altPath);
          if (fs.existsSync(altPath)) {
            fs.unlinkSync(altPath);
            console.log('✅ Successfully deleted file with alternative path:', altPath);
            fileDeleted = true;
            break;
          }
        }
        
        if (!fileDeleted) {
          console.log('❌ File not found with any alternative path');
        }
      }
    } catch (fileError) {
      console.error('❌ Error deleting file:', fileError);
      // Continue with database update even if file deletion fails
    }

    // Update artist's gallery in database
    await artist.update({
      gallery: JSON.stringify(currentGallery)
    });

    res.json({
      message: "Gallery image deleted successfully",
      gallery: currentGallery,
      deletedImage: imagePath
    });

  } catch (err) {
    console.error("Gallery delete error:", err);
    res.status(500).json({
      message: "Gallery image deletion failed",
      error: err.message
    });
  }
};

exports.uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded. Please select a profile picture."
      });
    }

    console.log('Uploaded file:', req.file);
    
    // Get file details from multer
    const {
      originalname,
      mimetype,
      size,
      buffer
    } = req.file;

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(mimetype)) {
      return res.status(400).json({
        message: "Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)."
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (size > maxSize) {
      return res.status(400).json({
        message: "File too large. Please upload an image smaller than 5MB."
      });
    }

    // Get user and artist details
    const user = await User.findByPk(userId);
    if (!user || user.role !== 3) {
      return res.status(404).json({
        message: "Artist not found"
      });
    }

    // Check if artist already has a profile and folder settings
    const existingArtist = await Artist.findOne({
      where: {
        userId: user.id
      }
    });

    let settings;
    if (existingArtist && existingArtist.settings) {
      // Use existing folder settings
      const existingSettings = JSON.parse(existingArtist.settings);
      settings = existingSettings;
    } else {
      // Generate new folder name only if no settings exist
      const folderName = `${user.role}_${user.username}_${Math.floor(Math.random() * 9000 + 1000)}`;
      settings = await createOrUpdateUserProfileSettings({
        role: user.role,
        name: user.name,
        username: user.username,
        email: user.email,
        contact_email: user.contact_email,
        phone_number: user.phone_number,
        folderName,
        userId: user.id
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = originalname.split('.').pop();
    const filename = `profile_${timestamp}_${originalname}`;

    // Create folder structure if it doesn't exist
    await createFolderStructure(settings);

    // Delete previous profile picture if it exists
    if (existingArtist && existingArtist.profile_picture) {
      try {
        const previousPicturePath = path.resolve(__dirname, "..", existingArtist.profile_picture);
        if (fs.existsSync(previousPicturePath)) {
          fs.unlinkSync(previousPicturePath);
          console.log('Deleted previous profile picture:', previousPicturePath);
        }
      } catch (error) {
        console.error('Error deleting previous profile picture:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Save the file to disk
    const folderPath = path.resolve(__dirname, "..", settings.path, settings.folder_name);
    const filePath = path.join(folderPath, filename);
    
    fs.writeFileSync(filePath, buffer);
    console.log('File saved to:', filePath);

    // At this point, settings.path + settings.folder_name points to the right folder.
    // Save the uploaded file's path in the Artist profile.
    const profilePicturePath = `${settings.path}${settings.folder_name}/${filename}`;
    await existingArtist.update({
      profile_picture: profilePicturePath
    });

    res.json({
      message: "Profile picture uploaded successfully",
      profile_picture: profilePicturePath,
      fileInfo: {
        originalName: originalname,
        size: size,
        mimeType: mimetype
      }
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({
      message: "Profile picture upload failed",
      error: err.message
    });
  }
};

// Delete profile picture
exports.deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user and artist details
    const user = await User.findByPk(userId);
    if (!user || user.role !== 3) {
      return res.status(404).json({
        message: "Artist not found"
      });
    }

    // Get artist data
    const artist = await Artist.findOne({
      where: { userId: user.id }
    });

    if (!artist) {
      return res.status(404).json({
        message: "Artist profile not found"
      });
    }

    // Check if artist has a profile picture
    if (!artist.profile_picture) {
      return res.status(404).json({
        message: "No profile picture found"
      });
    }

    // Delete the physical file
    try {
      const profilePicturePath = path.resolve(__dirname, "..", artist.profile_picture);
      if (fs.existsSync(profilePicturePath)) {
        fs.unlinkSync(profilePicturePath);
        console.log('Deleted profile picture file:', profilePicturePath);
      } else {
        console.log('Profile picture file not found on disk:', profilePicturePath);
      }
    } catch (fileError) {
      console.error('Error deleting profile picture file:', fileError);
      // Continue with database update even if file deletion fails
    }

    // Update artist's profile_picture to null in database
    await artist.update({
      profile_picture: null
    });

    res.json({
      message: "Profile picture deleted successfully",
      profile_picture: null
    });

  } catch (err) {
    console.error("Profile picture delete error:", err);
    res.status(500).json({
      message: "Profile picture deletion failed",
      error: err.message
    });
  }
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