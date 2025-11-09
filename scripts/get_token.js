#!/usr/bin/env node
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// SHA-256 hash function
function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function getAuthToken() {
  console.log('🔐 Getting Vorld Auth Token...\n');
  
  // You need to set these in your .env file
  const email = process.env.VORLD_EMAIL || process.argv[2];
  const password = process.env.VORLD_PASSWORD || process.argv[3];
  const vorldAppId = process.env.VORLD_APP_ID;
  
  if (!email || !password) {
    console.error('❌ Error: Email and password required\n');
    console.log('Usage:');
    console.log('  node scripts/get_token.js <email> <password>');
    console.log('  OR set VORLD_EMAIL and VORLD_PASSWORD in .env\n');
    process.exit(1);
  }
  
  if (!vorldAppId) {
    console.error('❌ Error: VORLD_APP_ID not set in .env\n');
    process.exit(1);
  }
  
  try {
    // Hash password with SHA-256 (Vorld requirement)
    const hashedPassword = sha256(password);
    
    console.log('📧 Email:', email);
    console.log('🔑 App ID:', vorldAppId);
    console.log('⏳ Authenticating...\n');
    
    // Try the auth endpoint
    const authUrl = 'https://vorld-auth.onrender.com/api/auth/login';
    
    const response = await axios.post(
      authUrl,
      {
        email: email,
        password: hashedPassword
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Vorld-App-ID': vorldAppId
        }
      }
    );
    
    if (response.data.success && response.data.data) {
      const token = response.data.data.accessToken;
      
      console.log('✅ Authentication successful!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Your JWT Token:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(token);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      console.log('📝 Add this to your .env file as:');
      console.log(`USER_TOKEN=${token}\n`);
      
      if (response.data.data.user) {
        console.log('👤 User Info:');
        console.log('   Email:', response.data.data.user.email);
        console.log('   Username:', response.data.data.user.username);
        console.log('   Verified:', response.data.data.user.verified);
      }
      
    } else {
      console.error('❌ Authentication failed:', response.data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('\n❌ Error getting token:\n');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data?.error || error.response.data);
      
      if (error.response.status === 401) {
        console.error('\n💡 Tips:');
        console.error('   - Check your email and password are correct');
        console.error('   - Make sure you have a Vorld account at https://vorld.app');
      }
    } else if (error.request) {
      console.error('Network error:', error.message);
      console.error('\n💡 Tips:');
      console.error('   - Check your internet connection');
      console.error('   - The Vorld API endpoint might be different');
      console.error('   - Try checking the Vorld documentation for the correct URL');
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

getAuthToken();

