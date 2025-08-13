// File: backend/controllers/auth.controller.js
const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
    validationResult
} = require("express-validator");
const { slugify } = require("../utils/fileUtils");
const createFolderStructure = require("../helpers/createFolderStructure");
const User = db.user;
const Organiser = db.organiser;
const Artist = db.artist;
const AclTrust = db.acl_trust;
const { createOrUpdateUserProfileSettings } = require("../helpers/userProfileHelper");

exports.register = async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array(),
        });
    }

    const {
        username,
        email,
        password,
        role = "user",
        name,
        contact_email,
        phone_number,
    } = req.body;

    try {
        // Check for existing user
        const existingUser = await User.findOne({
            where: {
                [db.Sequelize.Op.or]: [{
                    username,
                },
                {
                    email,
                },
                ],
            },
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
                errors: {
                    ...(existingUser.username === username && {
                        username: "Username already in use",
                    }),
                    ...(existingUser.email === email && {
                        email: "Email already in use",
                    }),
                },
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create folder structure FIRST before creating user
        let settings = null;
        let folderPath = null;

        if (role == 3) { // Artist
            // Generate folder name for artist
            const folderName = `${role}_${slugify(username)}_${Math.floor(Math.random() * 9000 + 1000)}`;
            
            settings = {
                setting_name: name || username,
                path: "frontend/public/artists/",
                folder_name: folderName
            };

            console.log("🎨 Creating artist folder with settings:", settings);

            // Create folder structure FIRST before user creation
            try {
                folderPath = await createFolderStructure(settings);
                console.log("✅ Artist folder structure created successfully at:", folderPath);
                
                // Verify the folder actually exists
                const fs = require('fs');
                if (!fs.existsSync(folderPath)) {
                    throw new Error(`Folder was not created at: ${folderPath}`);
                }
                
            } catch (folderError) {
                console.error("❌ Failed to create artist folder structure:", folderError);
                return res.status(500).json({
                    message: "Registration failed: Could not create artist folder structure",
                    error: folderError.message,
                    settings: settings
                });
            }
        } else if (role == 4) { // Organiser
            // Generate folder name for organiser
            const folderName = `${role}_${slugify(name || username)}_${Math.floor(Math.random() * 9000 + 1000)}`;
            
            settings = {
                setting_name: name || username,
                path: "frontend/public/organiser/",
                folder_name: folderName
            };

            console.log("🏢 Creating organiser folder with settings:", settings);

            // Create folder structure FIRST before user creation
            try {
                folderPath = await createFolderStructure(settings);
                console.log("✅ Organiser folder structure created successfully at:", folderPath);
                
                // Verify the folder actually exists
                const fs = require('fs');
                if (!fs.existsSync(folderPath)) {
                    throw new Error(`Folder was not created at: ${folderPath}`);
                }
                
            } catch (folderError) {
                console.error("❌ Failed to create organiser folder structure:", folderError);
                return res.status(500).json({
                    message: "Registration failed: Could not create organiser folder structure",
                    error: folderError.message,
                    settings: settings
                });
            }
        }

        // Only create user if folder creation succeeded (or if no folder needed for regular users)
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            role,
        });

        // Create role-specific profile with settings
        if (role == 3) { // Artist
            // Create artist profile in database
            await Artist.create({
                userId: user.id,
                stage_name: username,
                contact_email: email,
                phone_number: phone_number || null,
                settings: JSON.stringify(settings)
            });

            console.log("✅ Artist profile created in database");
        } else if (role == 4) { // Organiser
            await Organiser.create({
                userId: user.id,
                name: name || username,
                contact_email: email,
                phone_number: phone_number || null,
                settings: JSON.stringify(settings)
            });

            console.log("✅ Organiser profile created in database");
        }

        const result = user;

        // Generate JWT token
        const token = jwt.sign({
            id: result.id,
            role: result.role,
            username: result.username,
        },
            process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_make_it_long_and_random_123456789', {
            expiresIn: "1d",
        }
        );

        const userResponse = result.get();
        delete userResponse.password;

        res.status(201).json({
            message: "User registered successfully",
            user: userResponse,
            token,
        });
    } catch (err) {
        console.error("Registration error:", err);
        console.error("Full error details:", err.stack);
        res.status(500).json({
            message: "Registration failed",
            error: err.message,
            details: err.stack
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
                email,
            },
            include: [{
                model: AclTrust,
                as: "aclInfo",
                attributes: ["acl_name", "acl_display"],
            },],
        });

        if (!user)
            return res.status(401).json({
                message: "Invalid credentials",
            });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            return res.status(401).json({
                message: "Invalid credentials",
            });

        const userData = user.get({
            plain: true,
        });
        delete userData.password;

        // Add acl_display dynamically
        userData.acl_display = user.aclInfo?.acl_display || 'Unknown Role';
        // Add organiser_id or artist_id dynamically
        if (user.role === 4) {
            const organiser = await Organiser.findOne({
                where: {
                    userId: user.id,
                },
            });
            if (organiser) userData.organiser_id = organiser.id;
        } else if (user.role === 3) {
            const artist = await Artist.findOne({
                where: {
                    userId: user.id,
                },
            });
            if (artist) userData.artist_id = artist.id;
        }

        const token = jwt.sign({
            id: user.id,
            role: user.role,
            ...(userData.organiser_id && {
                organiser_id: userData.organiser_id,
            }),
            ...(userData.artist_id && {
                artist_id: userData.artist_id,
            }),
        },
            process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_make_it_long_and_random_123456789', {
            expiresIn: "1d",
        }
        );

        res.json({
            message: "Login successful",
            token,
            user: userData,
        });
    } catch (err) {
        res.status(500).json({
            message: "Login failed",
            error: err.message,
        });
    }
};

// Logout Controller
exports.logout = (req, res) => {
    try {
        // For JWT, instruct client to delete the token
        res.clearCookie("token"); // If you are using cookies for JWT

        return res.status(200).json({
            message: "Logged out successfully.",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "An error occurred during logout.",
        });
    }
};

// Get current user data only for artists
// This function retrieves the current user's data based on the JWT token
// if the user role is  artist, fetch the artist data as well

exports.getMe = async (req, res) => {
    try {
        const userId = req.params.id; // Get user ID from request parameters

        // Find the user by ID without problematic associations
        const user = await User.findByPk(userId, {
            include: [{
                model: db.acl_trust,
                as: 'aclInfo',
                attributes: ['acl_name', 'acl_display']
            }]
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // Get user data without password
        const userData = user.get();
        delete userData.password;

        // If user is an artist, fetch artist data separately
        if (user.role === 3) {
            const artist = await db.artist.findOne({
                where: { userId: user.id },
                attributes: ["id", "stage_name", "real_name", "genre", "bio", "phone_number", "profile_picture"]
            });
            if (artist) {
                userData.artist = artist;
                userData.artist_id = artist.id;
            }
        }

        // If user is an organiser, fetch organiser data separately
        if (user.role === 4) {
            const organiser = await db.organiser.findOne({
                where: { userId: user.id },
                attributes: ["id", "name", "contact_email", "phone_number", "logo"]
            });
            if (organiser) {
                userData.organiser = organiser;
                userData.organiser_id = organiser.id;
            }
        }

        res.status(200).json(userData);
    } catch (err) {
        console.error("Error fetching user data:", err);
        res.status(500).json({
            message: "Failed to fetch user data",
            error: err.message,
        });
    }
};