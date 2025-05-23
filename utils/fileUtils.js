// File: backend/utils/fileUtils.js
const fs = require("fs");
const path = require("path");
const db = require("../models"); // Adjust this path to your models directory


// Function to create folder structure
const createFolderStructure = async (roleID, id, username) => {
  try {
    const acl_id = parseInt(roleID, 10); // Ensure roleID is an integer

    console.log("Role ID:", acl_id);
    console.log(typeof acl_id);
    // Fetch the role name from acl_trusts
    const AclTrust = db.acl_trust;
    const role = await AclTrust.findOne({ where: { acl_id: acl_id } });

    if (!role) {
      throw new Error("Invalid role ID");
    }
    // Extract the role name
    const roleName = role.dataValues.acl_name;

    // Validate role
    if (!["organiser", "artist"].includes(roleName.toLowerCase())) {
      throw new Error("Invalid role. Must be 'organiser' or 'artist'.");
    }

    // Define the folder name using the ID and username
    const folderName = `${id}_${username}`;

    // Define the path to the uploads folder
    const uploadsPath = path.resolve(__dirname, "../../frontend/public/uploads/", roleName+"/", folderName);

    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }

    return uploadsPath; // Return the folder path for further use
  } catch (error) {
    console.error("Error creating folder structure:", error.message);
    throw error;
  }
};

module.exports = { createFolderStructure };