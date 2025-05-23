// File: backend/models/organiser.model.js
//Mark as Fovurite
module.exports = (sequelize, DataTypes) => {
  const Organiser = sequelize.define("organiser", {
    name: { type: DataTypes.STRING, allowNull: false },
    contact_email: { type: DataTypes.STRING, unique: true },
    phone_number: DataTypes.STRING,
    website: DataTypes.STRING,
    logo: DataTypes.STRING,
    gallery: DataTypes.JSON,
    createdDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    userId: {
      type: DataTypes.INTEGER,
    }
  });

  return Organiser;
};