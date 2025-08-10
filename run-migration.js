#!/usr/bin/env node

// Script to run the events table migration
const migrateEventsTable = require('./migrations/update_events_table');

console.log('Starting Events Table Migration...');
console.log('This will update the events table structure to use owner_id and owner_type');
console.log('instead of separate organiser_id and artist_id fields.');
console.log('');

migrateEventsTable()
  .then(() => {
    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('The events table now uses the new structure:');
    console.log('- owner_id: The ID of the event owner (artist or organiser)');
    console.log('- owner_type: Either "artist" or "organiser"');
    console.log('');
    console.log('You can now restart your backend server.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Please check the error above and try again.');
    console.error('If you need to rollback, you may need to restore from a backup.');
    process.exit(1);
  });
