//backend/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./models');
const authRoutes = require('./routes/auth.routes');
const artistRoutes = require('./routes/artist.routes');
const eventRoutes = require('./routes/event.routes.js');
const dashboardRoutes = require('./routes/dashboard.routes');
const organiserRoutes = require('./routes/organiser.routes');
const venueRoutes = require('./routes/venue.routes');
const aclRoutes = require('./routes/acl_trust.routes.js');

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Register routes after middleware is defined
app.use('/api/auth', authRoutes);           // Auth routes
app.use('/api/dashboard', dashboardRoutes); // Dashboard routes
app.use('/api/artists', artistRoutes);     // Artist routes
app.use('/api/events', eventRoutes);     // Events routes
app.use('/api/organisers', organiserRoutes);     // Events routes
app.use('/api/venue', venueRoutes);     // Events routes
app.use('/api', aclRoutes);           // ACL routes

// Database connection
db.sequelize.authenticate()
  .then(() => console.log("✅ Connected to MySQL database"))
  .catch((err) => console.error("❌ DB connection error:", err));

// Sync tables with the database
db.sequelize.sync({ alter: false }).then(() => {
  console.log("✅ Tables synced with database");
});


// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});