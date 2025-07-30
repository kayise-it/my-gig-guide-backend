//File location: 
module.exports = {
  HOST: process.env.DB_HOST || "localhost",
  USER: process.env.DB_USER || "root",
  PASSWORD: process.env.DB_PASSWORD || "root",
  DB: process.env.DB_NAME || "my_gig_guide",
  dialect: process.env.DB_DIALECT || "mysql",
};