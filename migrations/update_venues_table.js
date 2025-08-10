// Migration script to update venues table structure
// Run this script to migrate from artist_id to owner_id/owner_type

const db = require("../models");
const Venue = db.venue;

async function migrateVenuesTable() {
  try {
    console.log('Starting venues table migration...');

    // First, let's check if the venues table exists
    const tables = await db.sequelize.query(
      "SHOW TABLES LIKE 'venues'",
      { type: db.sequelize.QueryTypes.SELECT }
    );

    if (tables.length === 0) {
      console.log('Venues table does not exist. Creating it with new structure...');
      console.log('Please run your normal database sync first to create the venues table.');
      return;
    }

    // Check if the new columns already exist
    const tableInfo = await db.sequelize.query(
      "DESCRIBE venues",
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const hasNewColumns = tableInfo.some(col => col.Field === 'owner_id' || col.Field === 'owner_type');
    const hasOldColumns = tableInfo.some(col => col.Field === 'artist_id' || col.Field === 'organiser_id');

    if (hasNewColumns && !hasOldColumns) {
      console.log('Migration already completed. New structure is in place.');
      return;
    }

    // Add new columns if they don't exist
    if (!hasNewColumns) {
      console.log('Adding new columns: owner_id, owner_type');
      await db.sequelize.query(
        "ALTER TABLE venues ADD COLUMN owner_id INT",
        { type: db.sequelize.QueryTypes.RAW }
      );
      
      await db.sequelize.query(
        "ALTER TABLE venues ADD COLUMN owner_type ENUM('artist', 'organiser')",
        { type: db.sequelize.QueryTypes.RAW }
      );
    }

    // Migrate existing data
    console.log('Migrating existing data...');
    
    // Update venues that have artist_id
    await db.sequelize.query(
      "UPDATE venues SET owner_id = artist_id, owner_type = 'artist' WHERE artist_id IS NOT NULL AND artist_id != 0",
      { type: db.sequelize.QueryTypes.UPDATE }
    );

    // Update venues that have organiser_id (if any)
    await db.sequelize.query(
      "UPDATE venues SET owner_id = organiser_id, owner_type = 'organiser' WHERE organiser_id IS NOT NULL AND organiser_id != 0",
      { type: db.sequelize.QueryTypes.UPDATE }
    );

    // Make owner_id NOT NULL after migration
    await db.sequelize.query(
      "ALTER TABLE venues MODIFY COLUMN owner_id INT NOT NULL",
      { type: db.sequelize.QueryTypes.RAW }
    );

    await db.sequelize.query(
      "ALTER TABLE venues MODIFY COLUMN owner_type ENUM('artist', 'organiser') NOT NULL",
      { type: db.sequelize.QueryTypes.RAW }
    );

    // Remove old columns
    console.log('Removing old columns...');
    if (hasOldColumns) {
      await db.sequelize.query(
        "ALTER TABLE venues DROP COLUMN artist_id",
        { type: db.sequelize.QueryTypes.RAW }
      );

      await db.sequelize.query(
        "ALTER TABLE venues DROP COLUMN organiser_id",
        { type: db.sequelize.QueryTypes.RAW }
      );
    }

    console.log('Venues migration completed successfully!');
    
    // Verify migration
    const venueCount = await Venue.count();
    console.log(`Total venues in database: ${venueCount}`);
    
    const venuesWithOwner = await db.sequelize.query(
      "SELECT COUNT(*) as count FROM venues WHERE owner_id IS NOT NULL AND owner_type IS NOT NULL",
      { type: db.sequelize.QueryTypes.SELECT }
    );
    console.log(`Venues with owner data: ${venuesWithOwner[0].count}`);

  } catch (error) {
    console.error('Venues migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateVenuesTable()
    .then(() => {
      console.log('Venues migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Venues migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateVenuesTable;
