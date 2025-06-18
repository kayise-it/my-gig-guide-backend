// File: backend/models/acl_trust.model.js
module.exports = (sequelize, DataTypes) => {
  const AclTrust = sequelize.define("acl_trust", {
    acl_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true, // Ensure it increments automatically
      allowNull: false,
    },
    acl_name: {
      type: DataTypes.STRING,
      allowNull: false,
      description: "The name of the ACL trust",
    },
    acl_display: {
      type: DataTypes.STRING,
      allowNull: false,
      description: "The name of the ACL trust to display",
    }
  });

  return AclTrust;
};