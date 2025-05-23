// /backend/routes/landing.routes.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('<h1>Welcome to My Gig Guide</h1>');
});

module.exports = router;