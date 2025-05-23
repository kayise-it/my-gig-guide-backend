/*File location: 
module.exports = {
    HOST: "localhost",
    USER: "root",
    PASSWORD: "root", // or your actual password
    DB: "my_gig_guide_db",
    dialect: "mysql",
  };
*/
module.exports = {
  HOST: process.env.DB_HOST,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASS,
  DB: process.env.DB_NAME,
  PORT: process.env.DB_PORT || 3306,
};
