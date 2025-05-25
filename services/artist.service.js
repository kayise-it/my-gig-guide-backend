const db = require("../models");
const Artist = db.artist;

exports.getAllArtists = async () => {
  return await Artist.findAll();
};