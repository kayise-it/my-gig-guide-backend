// models/user_event_favorite.model.js
module.exports = (sequelize, DataTypes) => {
    const UserEventFavorite = sequelize.define("user_event_favorite", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id'
        },
        onDelete: 'CASCADE'
      }
    }, {
      tableName: 'user_event_favorites',
      indexes: [
        {
          unique: true,
          fields: ['userId', 'eventId']
        }
      ]
    });
  
    UserEventFavorite.associate = (models) => {
      UserEventFavorite.belongsTo(models.user, { 
        foreignKey: 'userId',
        as: 'user'
      });
      
      UserEventFavorite.belongsTo(models.event, { 
        foreignKey: 'eventId',
        as: 'event'
      });
    };
  
    return UserEventFavorite;
  };
