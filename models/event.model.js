// File: backend/models/event.model.js
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define("event", {
    name: { type: DataTypes.STRING, allowNull: false },
    userId: DataTypes.INTEGER,
    description: DataTypes.TEXT,
    date: { type: DataTypes.DATE, allowNull: false },
    time: { type: DataTypes.TIME, allowNull: false },
    price: DataTypes.FLOAT,
    ticket_url: DataTypes.STRING,
    poster: { type: DataTypes.STRING, allowNull: true }, // Poster image URL
    gallery: { type: DataTypes.STRING, allowNull: true }, // Comma-separated gallery URLs
    status: { type: DataTypes.STRING, allowNull: true, defaultValue: "scheduled" }, // Event status
    category: { type: DataTypes.STRING, allowNull: true }, // Category for event
    capacity: { type: DataTypes.INTEGER, allowNull: true }, // Event capacity
    venue_id: { type: DataTypes.INTEGER, allowNull: true }, // Foreign key to Venue
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  });

  // Relationships (Associations)
  Event.associate = (models) => {
    // Event is created by a user (creator)
    Event.belongsTo(models.User, {
      foreignKey: {
        name: 'userId',
        allowNull: false,
      },
      as: 'creator',
      onDelete: 'CASCADE',
    });

    // Event belongs to a Venue
    Event.belongsTo(models.Venue, {
      foreignKey: {
        name: 'venue_id',
        allowNull: true, // Allow NULL for flexibility
      },
      as: 'venue',
      onDelete: 'SET NULL',
    });
  };

  return Event;
};