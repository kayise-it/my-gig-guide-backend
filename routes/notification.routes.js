//backend/routes/notification.routes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth.middleware");

// POST /api/notifications/venue-booking
router.post('/venue-booking', verifyToken, async (req, res) => {
  try {
    const { venueId, venueName, venueOwnerEmail, bookerName, eventName, eventDate } = req.body;
    
    console.log('Venue booking notification received:', {
      venueId,
      venueName, 
      venueOwnerEmail,
      bookerName,
      eventName,
      eventDate
    });
    
    // For now, just log the notification
    // In a real app, you would send an email or push notification
    console.log(`📧 Notification: ${bookerName} wants to book ${venueName} for event "${eventName}" on ${eventDate}`);
    
    res.status(200).json({
      success: true,
      message: 'Venue owner notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending venue booking notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

module.exports = router;
