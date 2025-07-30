//routes/event.routes.js
const express = require("express");
const router = express.Router();
const db = require("../models");
const eventController = require("../controllers/event.controller");
const Event = db.event;
const {verifyToken } = require("../middleware/auth.middleware");

// Get all events
router.get("/", eventController.events);

// Create new event
router.post('/create_event', verifyToken, async (req, res) => {
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
        // Create event object
        const event = {
            userId: req.body.userId,
            organiser_id: req.body.organiser_id,
            name: req.body.name,
            description: req.body.description || null,
            date: req.body.date,
            time: req.body.time,
            price: req.body.price ? parseFloat(req.body.price) : 0,
            ticket_url: req.body.ticket_url || null,
            poster: req.body.poster || null,
            venue_id: req.body.venue_id || null,
        };

        const createdEvent = await Event.create(event);

        res.status(201).json({
            success: true,
            message: "Event created successfully",
            event: createdEvent,
            eventId: createdEvent.id // Include the new event ID in response
        });
    } catch (err) {
        // ... (keep your existing error handling) ...
        console.error("Error creating event:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Error creating event"
        });
    }
});

// Update event
router.put('/edit/:id', verifyToken, async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // Update event details
        event.name = req.body.name || event.name;
        event.description = req.body.description || event.description;
        event.date = req.body.date || event.date;
        event.time = req.body.time || event.time;
        event.price = req.body.price ? parseFloat(req.body.price) : event.price;
        event.ticket_url = req.body.ticket_url || event.ticket_url;

        await event.save();

        res.status(200).json({
            success: true,
            message: "Event updated successfully",
            event
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Error updating event"
        });
    }
});
/**
 * Get event by ID (duplicate of the route below, but without the typo in the error message)
 */
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
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
                organiser_id: organiserId  // Corrected: match the actual column name
            }
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