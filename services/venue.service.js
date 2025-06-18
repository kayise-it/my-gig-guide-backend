const db = require("../models");
const Venue = db.venue;

exports.getAllVenues = async () => {
  return await Venue.findAll();
};

exports.getOrganisersVenues = async (userId) => {
  return await Venue.findAll({
    where: { userId }
  });
}

exports.getVenuebyId = async (venueId) => {
  return await Venue.findOne({
    where: { id: venueId }
  });
};