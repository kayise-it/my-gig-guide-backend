// File: backend/models/event.model.js
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define("event", {
    name: { type: DataTypes.STRING, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    organiser_id: { type: DataTypes.INTEGER, allowNull: true },
    description: DataTypes.TEXT,
    date: { type: DataTypes.DATE, allowNull: false },
    time: { type: DataTypes.TIME, allowNull: false },
    price: DataTypes.FLOAT,
    ticket_url: DataTypes.STRING,
    poster: { type: DataTypes.STRING, allowNull: true },
    gallery: { type: DataTypes.STRING, allowNull: true },
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

    Event.belongsTo(models.organiser, {
      foreignKey: {
        name: 'organiser_id',
        allowNull: true,
      },
      as: 'organiser',
      onDelete: 'SET NULL',
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