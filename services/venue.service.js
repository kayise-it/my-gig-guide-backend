const db = require("../models");
const Venue = db.venue;

exports.getAllVenues = async () => {
  return await Venue.findAll({
    include: [
      {
        model: db.user,
        attributes: ["id", "username"],
        as: 'creator'
      },
      {
        model: db.artist,
        attributes: ["id", "stage_name", "real_name"],
        as: 'artistOwner'
      },
      {
        model: db.organiser,
        attributes: ["id", "name"],
        as: 'organiserOwner'
      }
    ]
  });
};

exports.getOrganisersVenues = async (organiserId) => {
  return await Venue.findAll({
    where: { 
      owner_id: organiserId,
      owner_type: 'organiser'
    },
    include: [
      {
        model: db.user,
        attributes: ["id", "username"],
        as: 'creator'
      },
      {
        model: db.organiser,
        attributes: ["id", "name"],
        as: 'organiserOwner'
      }
    ]
  });
};

exports.getArtistVenues = async (artistId) => {
  return await Venue.findAll({
    where: { 
      owner_id: artistId,
      owner_type: 'artist'
    },
    include: [
      {
        model: db.user,
        attributes: ["id", "username"],
        as: 'creator'
      },
      {
        model: db.artist,
        attributes: ["id", "stage_name", "real_name"],
        as: 'artistOwner'
      }
    ]
  });
};

exports.getVenuesByOwner = async (ownerId, ownerType) => {
  return await Venue.findAll({
    where: { 
      owner_id: ownerId,
      owner_type: ownerType
    },
    include: [
      {
        model: db.user,
        attributes: ["id", "username"],
        as: 'creator'
      },
      {
        model: db.artist,
        attributes: ["id", "stage_name", "real_name"],
        as: 'artistOwner'
      },
      {
        model: db.organiser,
        attributes: ["id", "name"],
        as: 'organiserOwner'
      }
    ]
  });
};

exports.getVenuebyId = async (venueId) => {
  return await Venue.findOne({
    where: { id: venueId },
    include: [
      {
        model: db.user,
        attributes: ["id", "username"],
        as: 'creator'
      },
      {
        model: db.artist,
        attributes: ["id", "stage_name", "real_name"],
        as: 'artistOwner'
      },
      {
        model: db.organiser,
        attributes: ["id", "name"],
        as: 'organiserOwner'
      }
    ]
  });
};