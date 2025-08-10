// File: backend/models/event.model.js
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define("event", {
    name: { type: DataTypes.STRING, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    owner_id: { type: DataTypes.INTEGER, allowNull: false },
    owner_type: { 
      type: DataTypes.ENUM('artist', 'organiser'), 
      allowNull: false,
      validate: {
        isIn: [['artist', 'organiser']]
      }
    },
    description: DataTypes.TEXT,
    date: { type: DataTypes.DATE, allowNull: false },
    time: { type: DataTypes.TIME, allowNull: false },
    price: DataTypes.FLOAT,
    ticket_url: DataTypes.STRING,
    poster: { type: DataTypes.STRING, allowNull: true },
    // Use TEXT to allow multiple image paths (comma-separated or JSON)
    gallery: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING, allowNull: true, defaultValue: "scheduled" },
    category: { type: DataTypes.STRING, allowNull: true },
    capacity: { type: DataTypes.INTEGER, allowNull: true },
    venue_id: { type: DataTypes.INTEGER, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });

  Event.associate = (models) => {
    Event.belongsTo(models.user, {
      foreignKey: {
        name: 'userId',
        allowNull: false,
      },
      as: 'creator',
      onDelete: 'CASCADE',
    });

    // Conditional associations without automatic foreign key constraints
    Event.belongsTo(models.artist, {
      foreignKey: 'owner_id',
      as: 'artistOwner',
      constraints: false // Disable automatic foreign key constraint
    });

    Event.belongsTo(models.organiser, {
      foreignKey: 'owner_id',
      as: 'organiserOwner',
      constraints: false // Disable automatic foreign key constraint
    });

    Event.belongsTo(models.venue, {
      foreignKey: {
        name: 'venue_id',
        allowNull: true,
      },
      as: 'venue',
      onDelete: 'SET NULL',
    });
  };

  return Event;
};