const dbConfig = require("../config/db.config.js");
const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require('bcrypt');

// ✅ Initialize Sequelize
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  logging: false, // Disable SQL logging
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// ✅ Load models
db.acl_trust = require("./acl_trust.model.js")(sequelize, DataTypes);
db.user = require("./user.model.js")(sequelize, DataTypes);
db.artist = require("./artist.model.js")(sequelize, DataTypes);
db.organiser = require("./organiser.model.js")(sequelize, DataTypes);
db.venue = require("./venue.model.js")(sequelize, DataTypes);
db.event = require("./event.model.js")(sequelize, DataTypes);
db.event_artist = require("./event_artist.model.js")(sequelize, DataTypes);
db.favorites = require("./favorite.model.js")(sequelize, DataTypes);

// ✅ Define model relationships
db.user.hasMany(db.venue, { foreignKey: 'userId' });
db.venue.belongsTo(db.user, { foreignKey: 'userId' });

db.organiser.hasMany(db.venue, { foreignKey: 'organiser_id' });
db.venue.belongsTo(db.organiser, { foreignKey: 'organiser_id' });

db.artist.hasMany(db.venue, { foreignKey: 'artist_id' });
db.venue.belongsTo(db.artist, { foreignKey: 'artist_id' });

// (Optional) Enable future use of associate() per model
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// ✅ Initial Setup: Insert roles and dummy data
(async () => {
  try {
    // ACL Trust roles
    const aclCount = await db.acl_trust.count();
    if (aclCount === 0) {
      await db.acl_trust.bulkCreate([
        { acl_name: "superuser", acl_display: "Superuser" },
        { acl_name: "admin", acl_display: "Administrator" },
        { acl_name: "artist", acl_display: "Artist" },
        { acl_name: "organiser", acl_display: "Event Organiser" },
        { acl_name: "venue", acl_display: "Venue Owner" },
        { acl_name: "user", acl_display: "User" },
      ]);
      console.log("✅ ACL trust roles inserted successfully.");
    }

    // Admin user
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

    // Dummy artist profile
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

module.exports = db;