// File: backend/controllers/artist.controller.js
const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
    validationResult
} = require('express-validator');
const Organiser = db.organiser;

//Find the organisation by ID
exports.userOrganisation = async (req, res) => {
    try {
        const organisation = await Organiser.findOne({
            where: {
                userId: req.params.id
            }
        });

        if (!organisation) {
            return res.status(404).json({
                message: 'Organisation not found'
            });
        }

        res.status(200).json(organisation);
    } catch (err) {
        console.error('Error fetching organisation:', err);
        res.status(500).json({
            message: 'Failed to fetch organisation',
            error: err.message
        });
    }
}

// Get organiser settings by ID
exports.getOrganiserSettings = async (req, res) => {
    try {
        const organiserId = req.params.id;
        const organiser = await Organiser.findOne({
            where: {
                id: organiserId
            },
            attributes: ['settings']
        });

        if (!organiser) {
            return res.status(404).json({
                message: 'Organiser not found'
            });
        }

        res.status(200).json(organiser);
    } catch (err) {
        console.error('Error fetching organiser settings:', err);
        res.status(500).json({
            message: 'Failed to fetch organiser settings',
            error: err.message
        });
    }
}