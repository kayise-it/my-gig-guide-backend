// backend/helpers/populateUserSettings.js

const db = require("../models");
const User = db.user;
const Artist = db.artist;
const Organiser = db.organiser;
const { createUserFolderStructure } = require("./userProfileHelper");

/**
 * Populates user settings for users who have empty settings
 */
async function populateUserSettings() {
    try {
        console.log('Starting to populate user settings...');

        // Get all users
        const users = await User.findAll();
        console.log(`Found ${users.length} users`);

        for (const user of users) {
            console.log(`Processing user: ${user.username} (ID: ${user.id})`);

            // Check if user is an artist
            const artist = await Artist.findOne({
                where: { userId: user.id }
            });

            if (artist) {
                console.log(`User ${user.username} is an artist`);
                
                // Check if artist has settings
                if (!artist.settings) {
                    const settings = createUserFolderStructure(user, artist, 'artists');
                    await artist.update({
                        settings: JSON.stringify(settings)
                    });
                    console.log(`Updated artist settings for ${user.username}`);
                } else {
                    console.log(`Artist ${user.username} already has settings`);
                }
            }

            // Check if user is an organiser
            const organiser = await Organiser.findOne({
                where: { userId: user.id }
            });

            if (organiser) {
                console.log(`User ${user.username} is an organiser`);
                
                // Check if organiser has settings
                if (!organiser.settings) {
                    const settings = createUserFolderStructure(user, organiser, 'organisers');
                    await organiser.update({
                        settings: JSON.stringify(settings)
                    });
                    console.log(`Updated organiser settings for ${user.username}`);
                } else {
                    console.log(`Organiser ${user.username} already has settings`);
                }
            }

            // If user is neither artist nor organiser, skip
            if (!artist && !organiser) {
                console.log(`User ${user.username} is neither artist nor organiser, skipping`);
            }
        }

        console.log('User settings population completed!');
    } catch (error) {
        console.error('Error populating user settings:', error);
        throw error;
    }
}

// Run if this file is executed directly
if (require.main === module) {
    populateUserSettings()
        .then(() => {
            console.log('Settings population script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Settings population script failed:', error);
            process.exit(1);
        });
}

module.exports = populateUserSettings;
