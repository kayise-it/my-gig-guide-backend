// File: backend/models/artist.model.js
module.exports = (sequelize, DataTypes) => {
  const Artist = sequelize.define("artist", {
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users', // Assuming you have a 'users' table
        key: 'id',
      },
      allowNull: false,
      onDelete: 'CASCADE', // Optional: to delete artist when user is deleted
    },
    stage_name: { type: DataTypes.STRING, allowNull: false },
    real_name: DataTypes.STRING,
    genre: DataTypes.STRING,
    bio: DataTypes.TEXT,
    phone_number: DataTypes.STRING,
    instagram: DataTypes.STRING,
    facebook: DataTypes.STRING,
    twitter: DataTypes.STRING,
    profile_picture: DataTypes.STRING,
    // Add new fields as needed
  });

  return Artist;
};