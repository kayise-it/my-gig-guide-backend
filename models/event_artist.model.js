// File: backend/models/event_artist.model.js
module.exports = (sequelize, DataTypes) => {
  const EventArtist = sequelize.define("event_artist", {
    event_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "events", // Refers to the `events` table
        key: "id"
      }
    },
    artist_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "artists", // Refers to the `artists` table
        key: "id"
      }
    }
  });

  return EventArtist;
};