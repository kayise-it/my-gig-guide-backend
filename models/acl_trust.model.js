// File: backend/models/acl_trust.model.js
module.exports = (sequelize, DataTypes) => {
  const AclTrust = sequelize.define("acl_trust", {
    acl_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    acl_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 50]
      },
      description: "The name of the ACL trust",
    },
    acl_display: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      },
      description: "The name of the ACL trust to display",
    }
  }, {
    // Add table options for better performance and security
    tableName: 'acl_trusts',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['acl_name']
      }
    ]
  });

  return AclTrust;
};