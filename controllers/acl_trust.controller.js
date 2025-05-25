// File: backend/controllers/acl_trust.controller.js
const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require('express-validator');
const AclTrust = db.acl_trust;

//Get the ACL trust for the front-end phasing registration, do not get admin or superuser
exports.getAclTrust = async (req, res) => {
  try {
    // Try to fetch all ACL trusts from the database
    const aclTrusts = await AclTrust.findAll({
      where: {
        acl_name: {
          [db.Sequelize.Op.notIn]: ["superuser", "admin"]
        }
      }
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
    // Fetch ACL trust by id and select only display_name
    const aclTrust = await AclTrust.findOne({
      where: {
        id: req.body.role
      },
      attributes: ['display_name']
    });

    if (!aclTrust) {
      return res.status(404).json({ message: 'Role not found' });
    }

    console.log("13134". aclTrust);
    res.status(200).json(aclTrust);
  } catch (err) {
    console.error('Error fetching role display name:', err);
    res.status(500).json({ message: 'Failed to fetch role display name', error: err.message });
  }
};

exports.getRoleIdName = async (req, res) => {
  try {
    // Fetch ACL trusts by role and select only display_name
    const aclTrusts = await AclTrust.findAll({
      where: {
        role: req.body.role
      },
      attributes: ['display_name']
    });

    if (aclTrusts.length === 0) {
      return res.status(404).json({ message: 'No roles found' });
    }

    res.status(200).json(aclTrusts);
  } catch (err) {
    console.error('Error fetching role display names:', err);
    res.status(500).json({ message: 'Failed to fetch role display names', error: err.message });
  }
};
