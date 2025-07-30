//File: backend/models/user.model.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("user", {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      //refers to the ACL trust table
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'acl_trusts', // name of the target model
        key: 'acl_id' // key in the target model that we're referencing
      }
    }
  });


  return User;
};