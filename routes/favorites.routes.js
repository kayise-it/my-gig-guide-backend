// routes/favorites.routes.js - New comprehensive favorites routes
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const db = require('../models');

// Helper function to get the correct favorite model and include
const getFavoriteModel = (type) => {
  const models = {
    artist: {
      model: db.user_artist_favorite,
      idField: 'artistId',
      include: {
        model: db.artist,
        as: 'artist',
        attributes: ['id', 'stage_name', 'real_name', 'genre', 'profile_picture']
      }
    },
    event: {
      model: db.user_event_favorite,
      idField: 'eventId',
      include: {
        model: db.event,
        as: 'event',
        attributes: ['id', 'name', 'date', 'time', 'poster']
      }
    },
    venue: {
      model: db.user_venue_favorite,
      idField: 'venueId',
      include: {
        model: db.venue,
        as: 'venue',
        attributes: ['id', 'name', 'location', 'main_picture']
      }
    },
    organiser: {
      model: db.user_organiser_favorite,
      idField: 'organiserId',
      include: {
        model: db.organiser,
        as: 'organiser',
        attributes: ['id', 'name', 'contact_email', 'logo']
      }
    }
  };
  return models[type];
};

// Add favorite
router.post('/', verifyToken, async (req, res) => {
  try {
    const { type, itemId } = req.body;
    
    if (!['artist', 'event', 'venue', 'organiser'].includes(type)) {
      return res.status(400).json({ message: 'Invalid favorite type' });
    }

    const favoriteConfig = getFavoriteModel(type);
    if (!favoriteConfig) {
      return res.status(400).json({ message: 'Invalid favorite type' });
    }

    const favoriteData = {
      userId: req.user.id,
      [favoriteConfig.idField]: itemId
    };

    const favorite = await favoriteConfig.model.create(favoriteData);
    res.status(201).json({ 
      message: 'Added to favorites',
      favorite,
      type
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Already in favorites' });
    }
    console.error('Add favorite error:', err);
    res.status(500).json({ message: 'Failed to add favorite' });
  }
});

// Remove favorite
router.delete('/', verifyToken, async (req, res) => {
  try {
    const { type, itemId } = req.body;
    
    if (!['artist', 'event', 'venue', 'organiser'].includes(type)) {
      return res.status(400).json({ message: 'Invalid favorite type' });
    }

    const favoriteConfig = getFavoriteModel(type);
    if (!favoriteConfig) {
      return res.status(400).json({ message: 'Invalid favorite type' });
    }

    const whereCondition = {
      userId: req.user.id,
      [favoriteConfig.idField]: itemId
    };

    const deleted = await favoriteConfig.model.destroy({
      where: whereCondition
    });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.status(200).json({ 
      message: 'Removed from favorites',
      type
    });
  } catch (err) {
    console.error('Remove favorite error:', err);
    res.status(500).json({ message: 'Failed to remove favorite' });
  }
});

// Check if item is favorited
router.get('/check', verifyToken, async (req, res) => {
  try {
    const { type, itemId } = req.query;
    
    if (!['artist', 'event', 'venue', 'organiser'].includes(type)) {
      return res.status(400).json({ message: 'Invalid favorite type' });
    }

    const favoriteConfig = getFavoriteModel(type);
    if (!favoriteConfig) {
      return res.status(400).json({ message: 'Invalid favorite type' });
    }

    const whereCondition = {
      userId: req.user.id,
      [favoriteConfig.idField]: itemId
    };

    const favorite = await favoriteConfig.model.findOne({
      where: whereCondition
    });

    res.json({ 
      isFavorite: !!favorite,
      type
    });
  } catch (err) {
    console.error('Check favorite error:', err);
    res.status(500).json({ message: 'Failed to check favorite status' });
  }
});

// Get all user favorites by type
router.get('/:type', verifyToken, async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['artist', 'event', 'venue', 'organiser'].includes(type)) {
      return res.status(400).json({ message: 'Invalid favorite type' });
    }

    const favoriteConfig = getFavoriteModel(type);
    if (!favoriteConfig) {
      return res.status(400).json({ message: 'Invalid favorite type' });
    }

    const favorites = await favoriteConfig.model.findAll({
      where: { userId: req.user.id },
      include: [favoriteConfig.include],
      order: [['createdAt', 'DESC']]
    });

    res.json({ 
      favorites,
      type,
      count: favorites.length
    });
  } catch (err) {
    console.error('Get favorites error:', err);
    res.status(500).json({ message: 'Failed to get favorites' });
  }
});

// Get all user favorites (all types combined)
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [artistFavorites, eventFavorites, venueFavorites, organiserFavorites] = await Promise.all([
      db.user_artist_favorite.findAll({
        where: { userId },
        include: [{
          model: db.artist,
          as: 'artist',
          attributes: ['id', 'stage_name', 'real_name', 'genre', 'profile_picture']
        }],
        order: [['createdAt', 'DESC']]
      }),
      db.user_event_favorite.findAll({
        where: { userId },
        include: [{
          model: db.event,
          as: 'event',
          attributes: ['id', 'name', 'date', 'time', 'poster']
        }],
        order: [['createdAt', 'DESC']]
      }),
      db.user_venue_favorite.findAll({
        where: { userId },
        include: [{
          model: db.venue,
          as: 'venue',
          attributes: ['id', 'name', 'location', 'main_picture']
        }],
        order: [['createdAt', 'DESC']]
      }),
      db.user_organiser_favorite.findAll({
        where: { userId },
        include: [{
          model: db.organiser,
          as: 'organiser',
          attributes: ['id', 'name', 'contact_email', 'logo']
        }],
        order: [['createdAt', 'DESC']]
      })
    ]);

    res.json({
      favorites: {
        artists: artistFavorites,
        events: eventFavorites,
        venues: venueFavorites,
        organisers: organiserFavorites
      },
      counts: {
        artists: artistFavorites.length,
        events: eventFavorites.length,
        venues: venueFavorites.length,
        organisers: organiserFavorites.length,
        total: artistFavorites.length + eventFavorites.length + venueFavorites.length + organiserFavorites.length
      }
    });
  } catch (err) {
    console.error('Get all favorites error:', err);
    res.status(500).json({ message: 'Failed to get favorites' });
  }
});

module.exports = router;
