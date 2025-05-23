//File location: backend/utils/uploadProfilePic.js
//Upload profile picture to the ../frontend/public/uploads/artist/{id}_{stage_name} directory
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const {
      id,
      stage_name
    } = req.body;
    if (!id || !stage_name) {
      return cb(new Error('Artist ID and stage name are required'));
    }

    //check if directory exists
    const dirPath = path.join(
      __dirname,
      '../..',
      'frontend',
      'public',
      'uploads',
      'artist',
      `${id}_${stage_name}`
    );
    if (fs.existsSync(dirPath)) {
      // Directory exists, proceed to upload
      console.log('Directory exists:', dirPath);
    }
    // If the directory does not exist, create it
    else {
      fs.mkdirSync(dirPath, {
        recursive: true
      });
      console.log('Directory created:', dirPath);
    }
    // Create upload directory path
    const uploadDir = path.join(
      __dirname,
      '../..',
      'frontend',
      'public',
      'uploads',
      'artist',
      `${id}_${stage_name}`
    );

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, {
        recursive: true
      });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Use original file name with timestamp prefix to avoid collisions
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.originalname}`;
    cb(null, filename);
  }
});

// File filter to allow only image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('profile_picture'); // Field name for the uploaded file

// Middleware function to handle profile picture upload
const uploadProfilePic = (req, res, next) => {
  upload(req, res, function (err) {
    if (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        return res.status(400).json({
          error: err.message
        });
      } else {
        // An unknown error occurred when uploading
        return res.status(500).json({
          error: err.message
        });
      }
    }

    // File uploaded successfully
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    // Add file path to request object for further processing
    req.profilePicturePath = path.join(
      'uploads',
      'artist',
      `${req.body.id}_${req.body.stage_name}`,
      req.file.filename
    );

    next();
  });
};

module.exports = uploadProfilePic;