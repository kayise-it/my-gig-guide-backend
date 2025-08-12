// models/user_venue_favorite.model.js
module.exports = (sequelize, DataTypes) => {
    const UserVenueFavorite = sequelize.define("user_venue_favorite", {
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
      venueId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'venues',
          key: 'id'
        },
        onDelete: 'CASCADE'
      }
    }, {
      tableName: 'user_venue_favorites',
      indexes: [
        {
          unique: true,
          fields: ['userId', 'venueId']
        }
      ]
    });
  
    UserVenueFavorite.associate = (models) => {
      UserVenueFavorite.belongsTo(models.user, { 
        foreignKey: 'userId',
        as: 'user'
      });
      
      UserVenueFavorite.belongsTo(models.venue, { 
        foreignKey: 'venueId',
        as: 'venue'
      });
    };
  
    return UserVenueFavorite;
  };
