const db = require("../models");
const Venue = db.venue;

exports.getAllVenues = async () => {
  return await Venue.findAll();
};