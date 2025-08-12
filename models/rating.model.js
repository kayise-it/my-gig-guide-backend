// models/rating.model.js - Polymorphic ratings for artists, events, venues, organisers
module.exports = (sequelize, DataTypes) => {
    const Rating = sequelize.define("rating", {
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
        }
      },
      rateableId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID of the rated item (artist, event, venue, organiser)'
      },
      rateableType: {
        type: DataTypes.ENUM('artist', 'event', 'venue', 'organiser'),
        allowNull: false,
        comment: 'Type of the rated item'
      },
      rating: {
        type: DataTypes.DECIMAL(2, 1),
        allowNull: false,
        validate: {
          min: 1.0,
          max: 5.0
        },
        comment: 'Rating from 1.0 to 5.0'
      },
      review: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Optional review text'
      }
    }, {
      tableName: 'ratings',
      indexes: [
        {
          unique: true,
          fields: ['userId', 'rateableId', 'rateableType']
        },
        {
          fields: ['rateableType', 'rateableId']
        },
        {
          fields: ['rating']
        }
      ]
    });
  
    Rating.associate = (models) => {
      // User association
      Rating.belongsTo(models.user, { 
        foreignKey: 'userId',
        as: 'user'
      });

      // Polymorphic associations
      Rating.belongsTo(models.artist, { 
        foreignKey: 'rateableId',
        constraints: false,
        as: 'artist'
      });
      
      Rating.belongsTo(models.event, { 
        foreignKey: 'rateableId',
        constraints: false,
        as: 'event'
      });
      
      Rating.belongsTo(models.venue, { 
        foreignKey: 'rateableId',
        constraints: false,
        as: 'venue'
      });
      
      Rating.belongsTo(models.organiser, { 
        foreignKey: 'rateableId',
        constraints: false,
        as: 'organiser'
      });
    };

    // Instance method to get the rated item
    Rating.prototype.getRateableItem = function() {
      return this[`get${this.rateableType.charAt(0).toUpperCase() + this.rateableType.slice(1)}`]();
    };

    // Class method to get average rating for an item
    Rating.getAverageRating = async function(rateableType, rateableId) {
      const result = await this.findOne({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
          [sequelize.fn('COUNT', sequelize.col('rating')), 'totalRatings']
        ],
        where: {
          rateableType,
          rateableId
        }
      });
      
      return {
        avgRating: result ? parseFloat(result.dataValues.avgRating || 0).toFixed(1) : 0,
        totalRatings: result ? parseInt(result.dataValues.totalRatings || 0) : 0
      };
    };
  
    return Rating;
  };
