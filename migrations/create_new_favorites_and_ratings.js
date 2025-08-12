// migrations/create_new_favorites_and_ratings.js
const db = require('../models');

const createNewFavoritesAndRatings = async () => {
  console.log('🔄 Starting migration: Create new favorites and ratings tables...');
  
  try {
    // Drop old favorites table if it exists
    console.log('📝 Dropping old favorites table...');
    await db.sequelize.query('DROP TABLE IF EXISTS favorites', { 
      type: db.sequelize.QueryTypes.RAW 
    });

    // Create new favorite tables
    console.log('📝 Creating user_artist_favorites table...');
    await db.user_artist_favorite.sync({ force: true });

    console.log('📝 Creating user_event_favorites table...');
    await db.user_event_favorite.sync({ force: true });

    console.log('📝 Creating user_venue_favorites table...');
    await db.user_venue_favorite.sync({ force: true });

    console.log('📝 Creating user_organiser_favorites table...');
    await db.user_organiser_favorite.sync({ force: true });

    console.log('📝 Creating ratings table...');
    await db.rating.sync({ force: true });

    console.log('✅ Migration completed successfully!');
    
    // Test data - Add a sample favorite for user 1 to artist 1 (if they exist)
    try {
      const user = await db.user.findByPk(1);
      const artist = await db.artist.findByPk(1);
      
      if (user && artist) {
        await db.user_artist_favorite.create({
          userId: user.id,
          artistId: artist.id
        });
        console.log('✅ Test favorite added: User 1 likes Artist 1');
      }
    } catch (testError) {
      console.log('ℹ️ Could not add test data:', testError.message);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  createNewFavoritesAndRatings()
    .then(() => {
      console.log('🎉 Migration script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = createNewFavoritesAndRatings;
