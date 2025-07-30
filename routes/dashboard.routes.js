// backend/routes/dashboard.routes.js
const express = require("express");
const router = express.Router();
const { verifyToken, restrictTo } = require("../middleware/auth.middleware");

router.get("/admin", verifyToken, restrictTo("admin"), (req, res) => {
  res.json({ message: "Welcome Admin Dashboard" });
});

router.get("/artist", verifyToken, restrictTo("artist"), (req, res) => {
  res.json({ message: "Welcome Artist " });
});

router.get("/organiser", verifyToken, restrictTo("organiser"), (req, res) => {
  res.json({ message: "Welcome Organiser Dashboard" });
});

router.get("/sponsor", verifyToken, restrictTo("sponsor"), (req, res) => {
  res.json({ message: "Welcome Sponsor Dashboard" });
});

module.exports = router;