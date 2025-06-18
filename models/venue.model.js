const {
  organiser
} = require(".");

module.exports = (sequelize, DataTypes) => {
  const Venue = sequelize.define("venue", {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    location: DataTypes.STRING,
    capacity: DataTypes.INTEGER,
    contact_email: {
      type: DataTypes.STRING,
      unique: true 
    },
    phone_number: DataTypes.STRING,
    website: DataTypes.STRING,
    address: DataTypes.STRING,
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true
    }, // Latitude for the venue location
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true
    }, // Longitude for the venue location
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    userId: {
      type: DataTypes.INTEGER,
    },
    artist_id: {
      //refers to the ACL trust table
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'artists', // name of the target model
        key: 'id' // key in the target model that we're referencing
      }
    },
    organiser_id: {
      //refers to the ACL trust table
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'organisers', // name of the target model
        key: 'id' // key in the target model that we're referencing
      }
    }
  });


  return Venue;
};