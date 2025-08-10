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
  }, {
    tableName: 'organisers' // Explicitly specify the table name
  });

  Organiser.associate = (models) => {
    Organiser.belongsTo(models.user, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Organiser can have many venues
    Organiser.hasMany(models.venue, {
      foreignKey: 'owner_id',
      constraints: false,
      scope: {
        owner_type: 'organiser'
      },
      as: 'venues'
    });

    // Organiser can have many events (as owner)
    Organiser.hasMany(models.event, {
      foreignKey: 'owner_id',
      constraints: false,
      scope: {
        owner_type: 'organiser'
      },
      as: 'ownedEvents'
    });
  };

  return Organiser;
};