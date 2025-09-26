
import { storage } from './server/storage.js';
import { AuthService } from './server/auth.js';

async function createAdminAccount() {
  try {
    console.log('🔍 Looking for existing admin account...');
    
    // Try to find the existing user
    const existingUser = await storage.getUserByUsername('admin');
    
    if (existingUser) {
      console.log('🗑️ Deleting existing admin account...');
      await storage.deleteUser(existingUser.id);
      console.log('✅ Existing admin account deleted');
    } else {
      console.log('ℹ️ No existing admin account found');
    }
    
    // Create the new admin account
    console.log('🔨 Creating new admin account...');
    const adminData = {
      username: 'admin',
      email: 'admin@drugscan.com',
      password: 'ILA1234567'
    };
    
    const result = await AuthService.registerAdmin(adminData);
    console.log('✅ Admin account created successfully!');
    console.log('Username:', result.user.username);
    console.log('Email:', result.user.email);
    console.log('Password: ILA1234567');
    console.log('Token generated:', result.token.substring(0, 20) + '...');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

createAdminAccount();
