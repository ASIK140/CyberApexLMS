require('dotenv').config();
const { connectDB } = require('./dist/config/database');
const { User } = require('./dist/models');

async function checkUsers() {
  try {
    console.log('📱 Connecting to database...');
    await connectDB();
    
    console.log('\n📋 Checking Users table:');
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'status']
    });
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
    } else {
      console.log(`✓ Found ${users.length} users:`);
      users.forEach((user, idx) => {
        console.log(`  ${idx + 1}. ${user.name} (${user.email}) - Role: ${user.role}, Status: ${user.status}`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkUsers();
