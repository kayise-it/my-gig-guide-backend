// File: backend/models/organiser.model.js
module.exports = (sequelize, DataTypes) => {
  const Organiser = sequelize.define("organiser", {
    name: { type: DataTypes.STRING, allowNull: false },
    contact_email: DataTypes.STRING,
    phone_number: DataTypes.STRING,
    website: DataTypes.STRING,
    logo: DataTypes.STRING,
    gallery: DataTypes.JSON,
    createdDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    userId: DataTypes.INTEGER,
    settings: DataTypes.TEXT
  });

  return Organiser;
};