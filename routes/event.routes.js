//routes/event.routes.js
const express = require("express");
const router = express.Router();
const db = require("../models");
const eventController = require("../controllers/event.controller");
const Event = db.event;
const Artist = db.artist;
const Organiser = db.organiser;
const User = db.user;
const {verifyToken } = require("../middleware/auth.middleware");
const { getUserFolderPath } = require("../helpers/userProfileHelper");

// Get all events
router.get("/", eventController.events);

const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Setup multer for file uploads - using any() to handle all fields
const upload = multer({
    storage: multer.memoryStorage()
});

// Create new event with file uploads
router.post('/create_event', verifyToken, upload.any(), async (req, res) => {
    try {
        // Validate request
        if (!req.body.name) {
            return res.status(400).json({
                message: "Event name is required"
            });
        }
        if (!req.body.date) {
            return res.status(400).json({
                message: "Event date is required"
            });
        }
        if (!req.body.time) {
            return res.status(400).json({
                message: "Event time is required"
            });
        }
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

        // Get user data
        const user = await User.findByPk(req.body.userId);
        if (!user) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        // Create event object first
        const event = {
            userId: req.body.userId,
            owner_id: parseInt(req.body.owner_id),
            owner_type: req.body.owner_type,
            name: req.body.name,
            description: req.body.description && req.body.description !== '' ? req.body.description : null,
            date: req.body.date,
            time: req.body.time,
            price: req.body.price && req.body.price !== '' ? parseFloat(req.body.price) : 0,
            ticket_url: req.body.ticket_url && req.body.ticket_url !== '' ? req.body.ticket_url : null,
            poster: null, // Will be updated after file upload
            venue_id: req.body.venue_id && req.body.venue_id !== '' ? parseInt(req.body.venue_id) : null,
            category: req.body.category && req.body.category !== '' ? req.body.category : null,
            capacity: req.body.capacity && req.body.capacity !== '' ? parseInt(req.body.capacity) : null,
            gallery: null, // Will be updated after file upload
        };

        const createdEvent = await Event.create(event);

        // Generate event folder name
        const eventFolderName = req.body.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const eventId = createdEvent.id;
        
        // Get or create user folder path
        const userType = req.body.owner_type === 'artist' ? 'artists' : 'organisers';
        let orgFolder = req.body.orgFolder;
        
        if (!orgFolder) {
            // Generate folder path if not provided, using events subfolder
            orgFolder = getUserFolderPath(user, ownerData, userType, 'events');
        }
        
        if (orgFolder) {
            const eventFolderPath = path.join(orgFolder, `${eventId}_${eventFolderName}`);
            const eventPosterPath = path.join(eventFolderPath, 'event_poster');
            const eventGalleryPath = path.join(eventFolderPath, 'gallery');

            // Create directories
            if (!fs.existsSync(eventFolderPath)) {
                fs.mkdirSync(eventFolderPath, { recursive: true });
            }
            if (!fs.existsSync(eventPosterPath)) {
                fs.mkdirSync(eventPosterPath, { recursive: true });
            }
            if (!fs.existsSync(eventGalleryPath)) {
                fs.mkdirSync(eventGalleryPath, { recursive: true });
            }

            let posterPath = null;
            let galleryPaths = [];

            // Handle poster upload
            if (req.files && req.files.length > 0) {
                const posterFile = req.files.find(file => file.fieldname === 'poster');
                if (posterFile) {
                    const posterExtension = path.extname(posterFile.originalname).toLowerCase();
                    const posterFileName = `event_poster_${Date.now()}${posterExtension}`;
                    const posterFullPath = path.join(eventPosterPath, posterFileName);
                    
                    fs.writeFileSync(posterFullPath, posterFile.buffer);
                    posterPath = path.join(`/${userType}`, path.basename(orgFolder), 'events', `${eventId}_${eventFolderName}`, 'event_poster', posterFileName);
                }

                // Handle gallery uploads
                const galleryFiles = req.files.filter(file => file.fieldname === 'gallery');
                for (let i = 0; i < galleryFiles.length; i++) {
                    const galleryFile = galleryFiles[i];
                    const galleryExtension = path.extname(galleryFile.originalname).toLowerCase();
                    const galleryFileName = `gallery_${Date.now()}_${i}${galleryExtension}`;
                    const galleryFullPath = path.join(eventGalleryPath, galleryFileName);
                    
                    fs.writeFileSync(galleryFullPath, galleryFile.buffer);
                    const galleryPath = path.join(`/${userType}`, path.basename(orgFolder), 'events', `${eventId}_${eventFolderName}`, 'gallery', galleryFileName);
                    galleryPaths.push(galleryPath);
                }
            }

            // Update event with file paths
            await createdEvent.update({
                poster: posterPath,
                gallery: galleryPaths.length > 0 ? galleryPaths.join(',') : null
            });
        }

        res.status(201).json({
            success: true,
            message: "Event created successfully",
            event: createdEvent,
            eventId: createdEvent.id
        });
    } catch (err) {
        console.error("Error creating event:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Error creating event"
        });
    }
});

// Update event with file uploads
router.put('/edit/:id', verifyToken, upload.any(), async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // Update basic event details
        event.name = req.body.name || event.name;
        event.description = req.body.description || event.description;
        event.date = req.body.date || event.date;
        event.time = req.body.time || event.time;
        event.price = req.body.price ? parseFloat(req.body.price) : event.price;
        event.ticket_url = req.body.ticket_url || event.ticket_url;
        event.category = req.body.category || event.category;
        event.capacity = req.body.capacity ? parseInt(req.body.capacity) : event.capacity;

        // Handle file uploads if provided
        const userType = req.body.owner_type === 'artist' ? 'artists' : 'organisers';
        let orgFolder = req.body.orgFolder;
        
        if (orgFolder && req.files && req.files.length > 0) {
            const eventFolderName = event.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            const eventFolderPath = path.join(orgFolder, `${event.id}_${eventFolderName}`);
            const eventPosterPath = path.join(eventFolderPath, 'event_poster');
            const eventGalleryPath = path.join(eventFolderPath, 'gallery');

            // Create directories if they don't exist
            if (!fs.existsSync(eventFolderPath)) {
                fs.mkdirSync(eventFolderPath, { recursive: true });
            }
            if (!fs.existsSync(eventPosterPath)) {
                fs.mkdirSync(eventPosterPath, { recursive: true });
            }
            if (!fs.existsSync(eventGalleryPath)) {
                fs.mkdirSync(eventGalleryPath, { recursive: true });
            }

            // Handle new poster upload
            const posterFile = req.files.find(file => file.fieldname === 'poster');
            if (posterFile) {
                const posterExtension = path.extname(posterFile.originalname).toLowerCase();
                const posterFileName = `event_poster_${Date.now()}${posterExtension}`;
                const posterFullPath = path.join(eventPosterPath, posterFileName);
                
                fs.writeFileSync(posterFullPath, posterFile.buffer);
                event.poster = path.join(`/${userType}`, path.basename(orgFolder), 'events', `${event.id}_${eventFolderName}`, 'event_poster', posterFileName);
            }

            // Handle new gallery uploads
            const galleryFiles = req.files.filter(file => file.fieldname === 'gallery');
            if (galleryFiles.length > 0) {
                const existingGallery = event.gallery ? event.gallery.split(',') : [];
                const newGalleryPaths = [];

                for (let i = 0; i < galleryFiles.length; i++) {
                    const galleryFile = galleryFiles[i];
                    const galleryExtension = path.extname(galleryFile.originalname).toLowerCase();
                    const galleryFileName = `gallery_${Date.now()}_${i}${galleryExtension}`;
                    const galleryFullPath = path.join(eventGalleryPath, galleryFileName);
                    
                    fs.writeFileSync(galleryFullPath, galleryFile.buffer);
                    const galleryPath = path.join(`/${userType}`, path.basename(orgFolder), 'events', `${event.id}_${eventFolderName}`, 'gallery', galleryFileName);
                    newGalleryPaths.push(galleryPath);
                }

                // Combine existing and new gallery paths
                event.gallery = [...existingGallery, ...newGalleryPaths].join(',');
            }
        }

        await event.save();

        res.status(200).json({
            success: true,
            message: "Event updated successfully",
            event
        });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error updating event"
        });
    }
});

// Get events by owner type and ID
router.get('/owner/:ownerType/:ownerId', async (req, res) => {
    try {
        const { ownerType, ownerId } = req.params;
        
        if (!['artist', 'organiser'].includes(ownerType)) {
            return res.status(400).json({
                success: false,
                message: "Owner type must be either 'artist' or 'organiser'"
            });
        }

        const events = await Event.findAll({
            where: {
                owner_id: parseInt(ownerId),
                owner_type: ownerType
            },
            include: [
                {
                    model: db.user,
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

        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        console.error("Error fetching events by owner:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching events by owner"
        });
    }
});

/**
 * Get event by ID (duplicate of the route below, but without the typo in the error message)
 */
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id, {
            include: [
                {
                    model: db.user,
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
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }
        res.status(200).json({
            success: true,
            event: event
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching event data"
        });
    }
});
router.delete('/delete/:id', verifyToken, eventController.deleteEvent);
// Get events for a specific organiser
router.get('/organiser/:id', verifyToken, async (req, res) => {
    try {
        const organiserId = parseInt(req.params.id, 10);
        

        const events = await Event.findAll({
            where: {
                owner_id: organiserId,
                owner_type: 'organiser'
            },
            include: [
                {
                    model: db.user,
                    attributes: ["id", "username"],
                    as: 'creator'
                },
                {
                    model: Organiser,
                    attributes: ["id", "name"],
                    as: 'organiserOwner'
                }
            ]
        });

        if (!events.length) {
            return res.status(200).json({
                success: false,
                message: "No events found for this organiser"
            });
        }

        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Error fetching events"
        });
    }
});
router.get("/getAllEventsByOrganiser/:id", verifyToken, eventController.getAllEventsByOrganiser);

router.get("/by_organiser/:id", verifyToken, eventController.getAllEventsByOrganiser);



module.exports = router;