// models/user_artist_favorite.model.js
module.exports = (sequelize, DataTypes) => {
    const UserArtistFavorite = sequelize.define("user_artist_favorite", {
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
      artistId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'artists',
          key: 'id'
        },
        onDelete: 'CASCADE'
      }
    }, {
      tableName: 'user_artist_favorites',
      indexes: [
        {
          unique: true,
          fields: ['userId', 'artistId']
        }
      ]
    });
  
    UserArtistFavorite.associate = (models) => {
      UserArtistFavorite.belongsTo(models.user, { 
        foreignKey: 'userId',
        as: 'user'
      });
      
      UserArtistFavorite.belongsTo(models.artist, { 
        foreignKey: 'artistId',
        as: 'artist'
      });
    };
  
    return UserArtistFavorite;
  };
