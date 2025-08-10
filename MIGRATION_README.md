# Events Table Migration Guide

This guide explains how to migrate your events table from the old structure (with separate `organiser_id` and `artist_id` fields) to the new structure (with `owner_id` and `owner_type` fields).

## What Changed

### Old Structure
```sql
events table:
- organiser_id (INT, nullable)
- artist_id (INT, nullable)
```

### New Structure
```sql
events table:
- owner_id (INT, NOT NULL)
- owner_type (ENUM('artist', 'organiser'), NOT NULL)
```

## Benefits of the New Structure

1. **Clear Ownership**: Each event has exactly one owner (either an artist or organiser)
2. **No Ambiguity**: No more confusion about which field to use
3. **Better Queries**: Simpler and more efficient database queries
4. **Polymorphic Associations**: Proper Sequelize associations for both owner types

## Migration Steps

### 1. Backup Your Database
**IMPORTANT**: Before running the migration, create a backup of your database.

```bash
# For MySQL
mysqldump -u your_username -p your_database_name > backup_before_migration.sql

# For PostgreSQL
pg_dump your_database_name > backup_before_migration.sql
```

### 2. Stop Your Backend Server
Make sure your backend server is not running during the migration.

### 3. Run the Migration

Navigate to the backend directory and run:

```bash
cd backend
node run-migration.js
```

The migration script will:
1. Add the new `owner_id` and `owner_type` columns
2. Migrate existing data from `organiser_id` and `artist_id` to the new structure
3. Remove the old columns
4. Verify the migration was successful

### 4. Restart Your Backend Server

After the migration completes successfully, restart your backend server:

```bash
npm start
# or
node index.js
```

## What the Migration Does

1. **Adds New Columns**: Creates `owner_id` and `owner_type` columns
2. **Migrates Data**: 
   - Events with `organiser_id` → `owner_id` = organiser_id, `owner_type` = 'organiser'
   - Events with `artist_id` → `owner_id` = artist_id, `owner_type` = 'artist'
3. **Removes Old Columns**: Drops `organiser_id` and `artist_id` columns
4. **Validates**: Ensures all events have proper owner data

## Verification

After migration, you can verify the data:

```sql
-- Check total events
SELECT COUNT(*) FROM events;

-- Check events with owner data
SELECT COUNT(*) FROM events WHERE owner_id IS NOT NULL AND owner_type IS NOT NULL;

-- Check events by owner type
SELECT owner_type, COUNT(*) FROM events GROUP BY owner_type;
```

## Rollback (If Needed)

If something goes wrong, you can restore from your backup:

```bash
# For MySQL
mysql -u your_username -p your_database_name < backup_before_migration.sql

# For PostgreSQL
psql your_database_name < backup_before_migration.sql
```

## Updated Code Structure

The following files have been updated to work with the new structure:

### Backend
- `models/event.model.js` - Updated model with new fields and associations
- `controllers/event.controller.js` - Updated controller methods
- `routes/event.routes.js` - Updated routes and validation
- `migrations/update_events_table.js` - Migration script
- `run-migration.js` - Migration runner

### Frontend
- `src/pages/Organiser/CreateEvent.jsx` - Updated form handling
- `src/api/eventService.js` - Updated API service methods

## New API Endpoints

The following new endpoints are available:

- `GET /api/events/owner/:ownerType/:ownerId` - Get events by owner type and ID
- `GET /api/events/owner/artist/:artistId` - Get events by artist
- `GET /api/events/owner/organiser/:organiserId` - Get events by organiser

## Testing

After migration, test the following:

1. **Create Events**: Try creating events as both artists and organisers
2. **View Events**: Check that events display correctly with owner information
3. **Edit Events**: Verify that event editing works properly
4. **Delete Events**: Ensure event deletion works as expected

## Support

If you encounter any issues during migration:

1. Check the console output for error messages
2. Verify your database connection settings
3. Ensure you have proper permissions to modify the database
4. Restore from backup if needed and try again

## Notes

- The migration is designed to be safe and reversible
- All existing data will be preserved
- The new structure is more maintainable and scalable
- Future event-related features will be easier to implement
