// routes/organiser.js
const express = require('express');
const router = express.Router();
const {verifyToken } = require("../middleware/auth.middleware");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const organiserController = require("../controllers/organiser.controller");
const db = require('../models');

// Get current organiser profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const organiser = await db.Organiser.findOne({ 
      where: { userId: req.user.id },
      include: [db.User]
    });
    
    if (!organiser) {
      return res.status(404).json({ message: 'Organiser profile not found' });
    }
    
    res.json(organiser);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch organiser profile' });
  }
});

// Update organiser profile
router.put('/me', verifyToken, upload.single('logo'), async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      contact_email: req.body.contact_email,
      phone_number: req.body.phone_number,
      website: req.body.website
    };

    if (req.file) {
      updateData.logo = `/uploads/${req.file.filename}`;
    }

    const [updated] = await db.Organiser.update(updateData, {
      where: { userId: req.user.id },
      returning: true
    });

    if (!updated) {
      return res.status(404).json({ message: 'Organiser profile not found' });
    }

    const organiser = await db.Organiser.findOne({ 
      where: { userId: req.user.id },
      include: [db.User]
    });

    res.json(organiser);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update organiser profile' });
  }
});

module.exports = router;