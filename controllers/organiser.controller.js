// File: backend/controllers/artist.controller.js
const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require('express-validator');
const Organiser = db.organiser;

//Find the organisation by ID
exports.userOrganisation = async (req, res) => {
    try {
        const organisation = await Organiser.findAll({
            where: {
                id: req.params.id
            }
        });

        if (!organisation) {
            return res.status(404).json({ message: 'Organisation not found' });
        }

        res.status(200).json(organisation);
    } catch (err) {
        console.error('Error fetching organisation:', err);
        res.status(500).json({ message: 'Failed to fetch organisation', error: err.message });
    }
}