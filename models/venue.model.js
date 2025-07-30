// File: backend/models/venue.model.js
module.exports = (sequelize, DataTypes) => {
  return sequelize.define("venue", {
    name: { type: DataTypes.STRING, allowNull: false },
    location: DataTypes.STRING,
    capacity: DataTypes.INTEGER,
    contact_email: { type: DataTypes.STRING, unique: true },
    phone_number: DataTypes.STRING,
    website: DataTypes.STRING,
    address: DataTypes.STRING,
    latitude: DataTypes.FLOAT,
    longitude: DataTypes.FLOAT,
    userId: DataTypes.INTEGER,
    artist_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "artists", key: "id" }
    }
  });
};