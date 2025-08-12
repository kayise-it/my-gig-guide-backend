//backend/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const db = require('./models');
const authRoutes = require('./routes/auth.routes');
const artistRoutes = require('./routes/artist.routes');
const eventRoutes = require('./routes/event.routes.js');
const dashboardRoutes = require('./routes/dashboard.routes');
const organiserRoutes = require('./routes/organiser.routes');
const venueRoutes = require('./routes/venue.routes');
const favoriteRoutes = require('./routes/favorites.routes');
const aclRoutes = require('./routes/acl_trust.routes.js');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://62.72.18.206',
    'http://62.72.18.206:5173',
    'http://62.72.18.206:5174',
    'https://my-gig-guide-backend.onrender.com'
  ], // frontend URLs
  credentials: true
}));
app.use(express.json());

// Serve static files from frontend public directory
app.use('/uploads', express.static(path.join(__dirname, '../frontend/public')));
app.use('/artists', express.static(path.join(__dirname, '../frontend/public/artists')));
app.use('/organisers', express.static(path.join(__dirname, '../frontend/public/organiser')));
app.use('/venues', express.static(path.join(__dirname, '../frontend/public/venues')));

// Debug static file paths
console.log('Static file paths:');
console.log('Artists:', path.join(__dirname, '../frontend/public/artists'));
console.log('Organisers:', path.join(__dirname, '../frontend/public/organiser'));
console.log('Venues:', path.join(__dirname, '../frontend/public/venues'));

// ✅ Register routes after middleware is defined
app.get('/api', (req, res) => {
  res.json({ message: 'API is live' });
});

// Serve uploaded files - simple route without regex issues
app.use('/files', express.static(path.join(__dirname, '../frontend/public')));
app.use('/api/auth', authRoutes);           // Auth routes
app.use('/api/dashboard', dashboardRoutes); // Dashboard routes
app.use('/api/artists', artistRoutes);     // Artist routes
app.use('/api/events', eventRoutes);     // Events routes
app.use('/api/organisers', organiserRoutes);     // Events routes
app.use('/api/venue', venueRoutes);     // Events routes
app.use('/api/favorites', favoriteRoutes);     // Favorite routes
app.use('/api/notifications', require('./routes/notification.routes')); // Notification routes
app.use('/api/', aclRoutes);          // ACL routes

// Database connection
db.sequelize.authenticate()
  .then(() => console.log("✅ Connected to MySQL database"))
  .catch((err) => console.error("❌ DB connection error:", err));

// Sync tables with the database then run initialization
db.sequelize
  .sync({ alter: false })
  .then(async () => {
    console.log("✅ Tables synced with database");
    if (typeof db.initializeData === 'function') {
      await db.initializeData();
    }
  })
  .catch((err) => {
    console.error("❌ Error syncing tables:", err);
  });

// Start the server
const PORT = process.env.PORT || 3001 || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Server is also accessible on http://0.0.0.0:${PORT}`);
});
