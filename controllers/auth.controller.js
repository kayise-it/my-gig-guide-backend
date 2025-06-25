// File: baclkend/controllers/auth.controller.js
const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  validationResult
} = require('express-validator');
const User = db.user;
const Organiser = db.organiser;
const Artist = db.artist;
const AclTrust = db.acl_trust;
const {
  createFolderStructure,
  slugify
} = require("../utils/fileUtils");


exports.register = async (req, res) => {

  try {
    const dirPath = path.join(__dirname, '..', 'uploads', 'users'); // Safer path
    console.log('Creating folder at:', dirPath);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, {
        recursive: true
      });
      console.log('Folder created.');
    } else {
      console.log('Folder already exists.');
    }

    // Proceed with rest of logic...
    res.status(200).json({
      message: 'Success'
    });

  } catch (err) {
    console.error('Error during folder creation:', err.message, err.stack);
    res.status(500).json({
      error: 'Failed to create folder',
      detail: err.message
    });
  }

  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    });
  }

  const {
    username,
    email,
    password,
    role = 'user',
    name,
    contact_email,
    phone_number,
    settings
  } = req.body;

  const randomFourDigits = Math.floor(1000 + Math.random() * 9000);
  const folderName = `${role}_${slugify(name || username)}_${randomFourDigits}`;

  console.log(role);

  let artistSettings = null;
  let organiserSettings = null;
  try {
    // Check for existing user
    const existingUser = await User.findOne({
      where: {
        [db.Sequelize.Op.or]: [{
            username
          },
          {
            email
          }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
        errors: {
          ...(existingUser.username === username && {
            username: "Username already in use"
          }),
          ...(existingUser.email === email && {
            email: "Email already in use"
          })
        }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user within a transaction
    const result = await db.sequelize.transaction(async (t) => {
      // Create user
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        role
      }, {
        transaction: t
      });

      // If organiser, create organiser profile
      if (role === '4') {
        organiserSettings = {
          setting_name: name || username,
          path: "../frontend/public/organiser/",
          folder_name: folderName
        };

        const organiserSettingsSerialized = JSON.stringify(organiserSettings);
        await Organiser.create({
          name: name || username, // Use provided name or fallback to username
          contact_email: contact_email || email,
          phone_number,
          settings: organiserSettingsSerialized,
          userId: user.id // Assuming you have this association
        }, {
          transaction: t
        });

        await createFolderStructure(organiserSettings);

      }
      if (role === '3') {
        artistSettings = {
          setting_name: name || username,
          path: "../frontend/public/artists/",
          folder_name: folderName
        };
        const artistSettingsSerialized = JSON.stringify(artistSettings);
        await Artist.create({
          stage_name: username, // Use provided name or fallback to username
          contact_email: contact_email || email,
          phone_number,
          settings: artistSettingsSerialized,
          userId: user.id // Assuming you have this association
        }, {
          transaction: t
        });
        await createFolderStructure(artistSettings);
      }

      return user;
    });

    // Generate JWT token
    const token = jwt.sign({
        id: result.id,
        role: result.role,
        username: result.username
      },
      process.env.JWT_SECRET, {
        expiresIn: '1d'
      }
    );

    // Return response without password
    const userResponse = result.get();
    delete userResponse.password;

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
      token
    });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({
      message: "Registration failed",
      error: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }

};

exports.login = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    const user = await User.findOne({
      where: {
        email
      },
      include: [{
        model: AclTrust,
        as: 'aclInfo',
        attributes: ['acl_name', 'acl_display']
      }]
    });

    if (!user) return res.status(401).json({
      message: "Invalid credentials"
    });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({
      message: "Invalid credentials"
    });

    const userData = user.get({
      plain: true
    });
    delete userData.password;

    // Add acl_display dynamically
    userData.acl_display = user.aclInfo ? .acl_display || 'Unknown Role';

    // Add organiser_id or artist_id dynamically
    if (user.role === 4) {
      const organiser = await Organiser.findOne({
        where: {
          userId: user.id
        }
      });
      if (organiser) userData.organiser_id = organiser.id;
    } else if (user.role === 3) {
      const artist = await Artist.findOne({
        where: {
          userId: user.id
        }
      });
      if (artist) userData.artist_id = artist.id;
    }

    const token = jwt.sign({
        id: user.id,
        role: user.role,
        ...(userData.organiser_id && {
          organiser_id: userData.organiser_id
        }),
        ...(userData.artist_id && {
          artist_id: userData.artist_id
        })
      },
      process.env.JWT_SECRET, {
        expiresIn: '1d'
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: userData
    });

  } catch (err) {
    res.status(500).json({
      message: "Login failed",
      error: err.message
    });
  }
};

// Logout Controller
exports.logout = (req, res) => {
  try {
    // For JWT, instruct client to delete the token
    res.clearCookie('token'); // If you are using cookies for JWT

    return res.status(200).json({
      message: "Logged out successfully."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "An error occurred during logout."
    });
  }
};

// Get current user data only for artists
// This function retrieves the current user's data based on the JWT token
// if the user role is  artist, fetch the artist data as well

exports.getMe = async (req, res) => {
  try {
    const userId = req.params.id; // Get user ID from request parameters

    // Find the user by ID
    const user = await User.findByPk(userId, {
      include: [{
        model: Artist,
        as: 'artist', // Assuming you have defined the alias in your model
        attributes: ['stage_name', 'contact_email', 'phone_number']
      }]
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Return user data without password
    const userData = user.get();
    delete userData.password;

    res.status(200).json(userData);
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({
      message: "Failed to fetch user data",
      error: err.message
    });
  }
}