
import { storage } from './server/storage.js';
import { AuthService } from './server/auth.js';

async function createDioBrandoAdmin() {
  try {
    console.log('🔍 Looking for existing diobrando account...');
    
    // Try to find the existing user
    const existingUser = await storage.getUserByUsername('diobrando');
    
    if (existingUser) {
      console.log('🗑️ Deleting existing diobrando account...');
      await storage.deleteUser(existingUser.id);
      console.log('✅ Existing diobrando account deleted');
    } else {
      console.log('ℹ️ No existing diobrando account found');
    }
    
    // Create the new admin account
    console.log('🔨 Creating new diobrando admin account...');
    const adminData = {
      username: 'diobrando',
      email: 'diobrando@drugscan.com',
      password: 'ILA1234567'
    };
    
    const result = await AuthService.registerAdmin(adminData);
    console.log('✅ DIO BRANDO Admin account created successfully!');
    console.log('Username:', result.user.username);
    console.log('Email:', result.user.email);
    console.log('Token generated:', result.token.substring(0, 20) + '...');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

createDioBrandoAdmin();
