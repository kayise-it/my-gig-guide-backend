//File location: backend/config/db.config.js
// ===========================================
// DATABASE CONFIGURATION
// ===========================================

module.exports = {
  // Use only when going live on VPS
  // HOST: process.env.DB_HOST || "your_vps_db_host",
  // USER: process.env.DB_USER || "your_vps_db_user", 
  // PASSWORD: process.env.DB_PASSWORD || "your_vps_db_password",
  // DB: process.env.DB_NAME || "your_vps_db_name",
  
  // Use only when we are working on localhost
  HOST: process.env.DB_HOST || "localhost",
  USER: process.env.DB_USER || "root",
  PASSWORD: process.env.DB_PASSWORD || "root",
  DB: process.env.DB_NAME || "my_gig_guide_db",
  dialect: process.env.DB_DIALECT || "mysql",
};