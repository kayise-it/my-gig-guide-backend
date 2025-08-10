// Migration script to update events table structure
// Run this script to migrate from organiser_id/artist_id to owner_id/owner_type

const db = require("../models");
const Event = db.event;

async function migrateEventsTable() {
  try {
    console.log('Starting events table migration...');

    // First, let's check if the events table exists
    const tables = await db.sequelize.query(
      "SHOW TABLES LIKE 'events'",
      { type: db.sequelize.QueryTypes.SELECT }
    );

    if (tables.length === 0) {
      console.log('Events table does not exist. Creating it with new structure...');
      // If table doesn't exist, we can create it with the new structure
      // This would be handled by your normal Sequelize sync
      console.log('Please run your normal database sync first to create the events table.');
      return;
    }

    // Check if the new columns already exist
    const tableInfo = await db.sequelize.query(
      "DESCRIBE events",
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const hasNewColumns = tableInfo.some(col => col.Field === 'owner_id' || col.Field === 'owner_type');
    const hasOldColumns = tableInfo.some(col => col.Field === 'organiser_id' || col.Field === 'artist_id');

    if (hasNewColumns && !hasOldColumns) {
      console.log('Migration already completed. New structure is in place.');
      return;
    }

    // Add new columns if they don't exist
    if (!hasNewColumns) {
      console.log('Adding new columns: owner_id, owner_type');
      await db.sequelize.query(
        "ALTER TABLE events ADD COLUMN owner_id INT",
        { type: db.sequelize.QueryTypes.RAW }
      );
      
      await db.sequelize.query(
        "ALTER TABLE events ADD COLUMN owner_type ENUM('artist', 'organiser')",
        { type: db.sequelize.QueryTypes.RAW }
      );
    }

    // Migrate existing data
    console.log('Migrating existing data...');
    
    // Update events that have organiser_id
    await db.sequelize.query(
      "UPDATE events SET owner_id = organiser_id, owner_type = 'organiser' WHERE organiser_id IS NOT NULL AND organiser_id != 0",
      { type: db.sequelize.QueryTypes.UPDATE }
    );

    // Update events that have artist_id
    await db.sequelize.query(
      "UPDATE events SET owner_id = artist_id, owner_type = 'artist' WHERE artist_id IS NOT NULL AND artist_id != 0",
      { type: db.sequelize.QueryTypes.UPDATE }
    );

    // Make owner_id NOT NULL after migration
    await db.sequelize.query(
      "ALTER TABLE events MODIFY COLUMN owner_id INT NOT NULL",
      { type: db.sequelize.QueryTypes.RAW }
    );

    await db.sequelize.query(
      "ALTER TABLE events MODIFY COLUMN owner_type ENUM('artist', 'organiser') NOT NULL",
      { type: db.sequelize.QueryTypes.RAW }
    );

    // Remove old columns
    console.log('Removing old columns...');
    await db.sequelize.query(
      "ALTER TABLE events DROP COLUMN organiser_id",
      { type: db.sequelize.QueryTypes.RAW }
    );

    await db.sequelize.query(
      "ALTER TABLE events DROP COLUMN artist_id",
      { type: db.sequelize.QueryTypes.RAW }
    );

    console.log('Migration completed successfully!');
    
    // Verify migration
    const eventCount = await Event.count();
    console.log(`Total events in database: ${eventCount}`);
    
    const eventsWithOwner = await db.sequelize.query(
      "SELECT COUNT(*) as count FROM events WHERE owner_id IS NOT NULL AND owner_type IS NOT NULL",
      { type: db.sequelize.QueryTypes.SELECT }
    );
    console.log(`Events with owner data: ${eventsWithOwner[0].count}`);

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateEventsTable()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateEventsTable;
