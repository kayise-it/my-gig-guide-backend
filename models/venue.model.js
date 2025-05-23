module.exports = (sequelize, DataTypes) => {
  const Venue = sequelize.define("venue", {
    name: { type: DataTypes.STRING, allowNull: false },
    location: DataTypes.STRING,
    capacity: DataTypes.INTEGER,
    contact_email: { type: DataTypes.STRING, unique: true },
    phone_number: DataTypes.STRING,
    website: DataTypes.STRING,
    address: DataTypes.STRING,
    latitude: { type: DataTypes.FLOAT, allowNull: true }, // Latitude for the venue location
    longitude: { type: DataTypes.FLOAT, allowNull: true }, // Longitude for the venue location
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
    }
  });

  return Venue;
};