
const { storage } = require('./server/storage');
const { AuthService } = require('./server/auth');

async function deleteAndRecreateAdmin() {
  try {
    console.log('🔍 Looking for existing admin account...');
    
    // Try to find the existing admin user
    const existingUser = await storage.getUserByUsername('minhnhatconan');
    
    if (existingUser) {
      console.log('🗑️ Deleting existing admin account...');
      await storage.deleteUser(existingUser.id);
      console.log('✅ Existing admin account deleted');
    } else {
      console.log('ℹ️ No existing admin account found');
    }
    
    // Recreate the admin account
    console.log('🔨 Creating new admin account...');
    const adminData = {
      username: 'minhnhatconan',
      email: 'admin@drugscan.com',
      password: 'ILA1234567'
    };
    
    const result = await AuthService.registerAdmin(adminData);
    console.log('✅ Admin account created successfully!');
    console.log('Username:', result.user.username);
    console.log('Email:', result.user.email);
    console.log('Token generated:', result.token.substring(0, 20) + '...');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

deleteAndRecreateAdmin();
