// File: backend/controllers/acl_trust.controller.js
const db = require("../models");
const AclTrust = db.acl_trust;
const aclCache = require("../utils/aclCache");

//Get the ACL trust for the front-end phasing registration, do not get admin or superuser
exports.getAclTrust = async (req, res) => {
  try {
    // Define restricted roles that should not be exposed publicly
    const restrictedRoles = process.env.RESTRICTED_ROLES ? 
      process.env.RESTRICTED_ROLES.split(',') : 
      ["superuser", "admin"];
    
    // Try to fetch all ACL trusts from the database
    const aclTrusts = await AclTrust.findAll({
      where: {
        acl_name: {
          [db.Sequelize.Op.notIn]: restrictedRoles
        }
      },
      attributes: ['acl_id', 'acl_name', 'acl_display'] // Only return necessary fields
    });
    
    if (aclTrusts.length === 0) {
      return res.status(404).json({ message: 'No ACL trusts found' });
    }

    // If found, return the list of ACL trusts
    res.status(200).json(aclTrusts);
  } catch (err) {
    console.error('Error fetching ACL trusts:', err);
    res.status(500).json({ message: 'Failed to fetch ACL trusts', error: err.message });
  }
};

exports.getRoleIdName = async (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    
    // Validate roleId parameter
    if (isNaN(roleId) || roleId <= 0) {
      return res.status(400).json({ message: 'Invalid role ID provided' });
    }
    
    // Fetch ACL trust by acl_id and select display name
    const aclTrust = await AclTrust.findOne({
      where: {
        acl_id: roleId
      },
      attributes: ['acl_display']
    });

    if (!aclTrust) {
      return res.status(404).json({ message: 'Role not found' });
    }

    res.status(200).json({ display_name: aclTrust.acl_display });
  } catch (err) {
    console.error('Error fetching role display name:', err);
    res.status(500).json({ message: 'Failed to fetch role display name', error: err.message });
  }
};
