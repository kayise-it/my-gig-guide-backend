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
      onDelete: 'CASCADE',
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

    // Raw TEXT for storing JSON string
    settings: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    
    // Gallery field to store array of image paths as JSON string
    gallery: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON string containing array of gallery image paths'
    },
  }, {
    tableName: 'artists' // Explicitly specify the table name
  });

  Artist.associate = (models) => {
    Artist.belongsTo(models.user, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Artist can have many venues
    Artist.hasMany(models.venue, {
      foreignKey: 'owner_id',
      constraints: false,
      scope: {
        owner_type: 'artist'
      },
      as: 'venues'
    });

    // Artist can have many events (as owner)
    Artist.hasMany(models.event, {
      foreignKey: 'owner_id',
      constraints: false,
      scope: {
        owner_type: 'artist'
      },
      as: 'ownedEvents'
    });
  };

  return Artist;
};