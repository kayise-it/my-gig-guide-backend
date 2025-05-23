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

  // Insert default roles after defining and syncing the model
  AclTrust.afterSync(async () => {
    try {
      // Check if the data already exists to avoid duplicates
      const exists = await AclTrust.count();
      if (exists === 0) {
        await AclTrust.bulkCreate([
          { acl_name: "superuser", acl_display: "Superuser" },
          { acl_name: "admin", acl_display: "Administrator" },
          { acl_name: "artist", acl_display: "Artist" },
          { acl_name: "organiser", acl_display: "Event Organiser" },
          { acl_name: "venue", acl_display: "Venue Owner" },
          { acl_name: "user", acl_display: "User" },
        ]);
        console.log("ACL trust roles inserted successfully.");
      }
    } catch (err) {
      console.error("Error inserting ACL trust roles:", err);
    }
  });

  return AclTrust;
};