#!/usr/bin/env node

// Script to run the ACL Trusts table migration
const createAclTrustsTable = require('./migrations/create_acl_trusts_table');

console.log('Starting ACL Trusts Table Migration...');
console.log('This will create the acl_trusts table and seed it with default roles.');
console.log('');

createAclTrustsTable()
  .then(() => {
    console.log('');
    console.log('✅ ACL Trusts migration completed successfully!');
    console.log('The acl_trusts table now contains the following roles:');
    console.log('- 1: Superuser');
    console.log('- 2: Administrator');
    console.log('- 3: Artist');
    console.log('- 4: Event Organiser');
    console.log('- 5: Venue Owner');
    console.log('- 6: User');
    console.log('');
    console.log('You can now restart your backend server.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ ACL Trusts migration failed:', error.message);
    console.error('');
    console.error('Please check the error above and try again.');
    process.exit(1);
  });
