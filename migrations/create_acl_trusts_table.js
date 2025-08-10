// Migration script to create and seed acl_trusts table
const db = require("../models");

async function createAclTrustsTable() {
  try {
    console.log('Starting ACL Trusts table migration...');

    // Check if acl_trusts table exists
    const tables = await db.sequelize.query(
      "SHOW TABLES LIKE 'acl_trusts'",
      { type: db.sequelize.QueryTypes.SELECT }
    );

    if (tables.length === 0) {
      console.log('Creating acl_trusts table...');
      
      // Create the acl_trusts table
      await db.sequelize.query(`
        CREATE TABLE acl_trusts (
          acl_id INT AUTO_INCREMENT PRIMARY KEY,
          acl_name VARCHAR(255) NOT NULL,
          acl_display VARCHAR(255) NOT NULL,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL
        )
      `, { type: db.sequelize.QueryTypes.RAW });
      
      console.log('✅ acl_trusts table created successfully');
    } else {
      console.log('acl_trusts table already exists');
    }

    // Check if data already exists
    const aclCount = await db.sequelize.query(
      "SELECT COUNT(*) as count FROM acl_trusts",
      { type: db.sequelize.QueryTypes.SELECT }
    );

    if (aclCount[0].count === 0) {
      console.log('Seeding acl_trusts table with default roles...');
      
      // Insert default ACL roles
      await db.sequelize.query(`
        INSERT INTO acl_trusts (acl_id, acl_name, acl_display, createdAt, updatedAt) VALUES
        (1, 'superuser', 'Superuser', NOW(), NOW()),
        (2, 'admin', 'Administrator', NOW(), NOW()),
        (3, 'artist', 'Artist', NOW(), NOW()),
        (4, 'organiser', 'Event Organiser', NOW(), NOW()),
        (5, 'venue', 'Venue Owner', NOW(), NOW()),
        (6, 'user', 'User', NOW(), NOW())
      `, { type: db.sequelize.QueryTypes.INSERT });
      
      console.log('✅ ACL trust roles seeded successfully');
    } else {
      console.log('ACL trust roles already exist');
    }

    // Verify the migration
    const finalCount = await db.sequelize.query(
      "SELECT COUNT(*) as count FROM acl_trusts",
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    console.log(`Total ACL trust roles in database: ${finalCount[0].count}`);
    
    // Show the roles
    const roles = await db.sequelize.query(
      "SELECT acl_id, acl_name, acl_display FROM acl_trusts ORDER BY acl_id",
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    console.log('Available roles:');
    roles.forEach(role => {
      console.log(`  ${role.acl_id}: ${role.acl_display} (${role.acl_name})`);
    });

    console.log('✅ ACL Trusts migration completed successfully!');
    
  } catch (error) {
    console.error('❌ ACL Trusts migration failed:', error);
    throw error;
  }
}

module.exports = createAclTrustsTable;
