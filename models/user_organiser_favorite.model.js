// models/user_organiser_favorite.model.js
module.exports = (sequelize, DataTypes) => {
    const UserOrganiserFavorite = sequelize.define("user_organiser_favorite", {
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
      organiserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'organisers',
          key: 'id'
        },
        onDelete: 'CASCADE'
      }
    }, {
      tableName: 'user_organiser_favorites',
      indexes: [
        {
          unique: true,
          fields: ['userId', 'organiserId']
        }
      ]
    });
  
    UserOrganiserFavorite.associate = (models) => {
      UserOrganiserFavorite.belongsTo(models.user, { 
        foreignKey: 'userId',
        as: 'user'
      });
      
      UserOrganiserFavorite.belongsTo(models.organiser, { 
        foreignKey: 'organiserId',
        as: 'organiser'
      });
    };
  
    return UserOrganiserFavorite;
  };
