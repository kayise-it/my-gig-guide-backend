// models/favorite.model.js
module.exports = (sequelize, DataTypes) => {
    const Favorite = sequelize.define("favorite", {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      organiserId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    });
  
    Favorite.associate = (models) => {
      Favorite.belongsTo(models.user, { foreignKey: 'userId' });
      Favorite.belongsTo(models.organiser, { foreignKey: 'organiserId' });
    };
  
    return Favorite;
  };