// routes/favorites.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../models');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const favorite = await db.Favorite.create({
      userId: req.user.id,
      organiserId: req.body.organiserId
    });
    res.status(201).json(favorite);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add favorite' });
  }
});

router.delete('/', authMiddleware, async (req, res) => {
  try {
    await db.Favorite.destroy({
      where: {
        userId: req.user.id,
        organiserId: req.body.organiserId
      }
    });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove favorite' });
  }
});

router.get('/check', authMiddleware, async (req, res) => {
  try {
    const favorite = await db.Favorite.findOne({
      where: {
        userId: req.user.id,
        organiserId: req.query.organiserId
      }
    });
    res.json({ isFavorite: !!favorite });
  } catch (err) {
    res.status(500).json({ message: 'Failed to check favorite status' });
  }
});

module.exports = router;