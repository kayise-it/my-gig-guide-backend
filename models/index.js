// File: backend/models/index.js
const dbConfig = require("../config/db.config.js");
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  logging: false, // 👈 turn off SQL logs
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// ✅ Load all models
db.acl_trust = require("./acl_trust.model.js")(sequelize, DataTypes);
db.user = require("./user.model.js")(sequelize, DataTypes);
db.artist = require("./artist.model.js")(sequelize, DataTypes);
db.organiser = require("./organiser.model.js")(sequelize, DataTypes);
db.venue = require("./venue.model.js")(sequelize, DataTypes);
db.event = require("./event.model.js")(sequelize, DataTypes);
db.event_artist = require("./event_artist.model.js")(sequelize, DataTypes);
db.favorites = require("./favorite.model.js")(sequelize, DataTypes);

// ✅ Setup associations

// Event to Venue relationship remains the same
db.event.belongsTo(db.venue, { foreignKey: 'venue_id' });
db.venue.hasMany(db.event, { foreignKey: 'venue_id' });

// Many-to-many relationship between Event and Artist
db.event.belongsToMany(db.artist, { through: db.event_artist });
db.artist.belongsToMany(db.event, { through: db.event_artist });

module.exports = db;

const bcrypt = require('bcrypt');

// ✅ Sync all tables and insert dummy data
(async () => {
  try {
    await sequelize.sync();

    // Create admin user if not exists
    const [admin, created] = await db.user.findOrCreate({
      where: { email: "thandov.hlophe@gmail.com" },
      defaults: {
        username: "Thando",
        password: await bcrypt.hash("thandov.hlophe@gmail.com", 12),
        role: 3,
      },
    });

    if (created) {
      console.log("✅ Admin user created");
    } else {
      console.log("ℹ️ Admin user already exists");
    }

    // Create dummy artist profile linked to admin
    const artistExists = await db.artist.findOne({ where: { userId: admin.id } });

    if (!artistExists) {
      await db.artist.create({
        userId: admin.id,
        stage_name: 'Thando Vibes',
        real_name: 'Thando Hlophe',
        genre: 'Afro Soul',
        bio: 'An emerging voice in Afro Soul from Mpumalanga.',
        phone_number: '0721234567',
        instagram: 'https://instagram.com/thandovibes',
        facebook: 'https://facebook.com/thandovibes',
        twitter: 'https://twitter.com/thandovibes',
        profile_picture: '/images/artists/thando.jpg',
      });
      console.log("✅ Dummy artist added successfully.");
    } else {
      console.log("ℹ️ Dummy artist already exists.");
    }
  } catch (error) {
    console.error("❌ Error during initial setup:", error);
  }
})();