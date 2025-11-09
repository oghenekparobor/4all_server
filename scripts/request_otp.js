#!/usr/bin/env node
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// SHA-256 hash function
function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function requestOTP() {
  console.log('📨 Requesting OTP for Email Verification...\n');
  
  // Get parameters
  const email = process.env.VORLD_EMAIL || process.argv[2];
  const password = process.env.VORLD_PASSWORD || process.argv[3];
  const vorldAppId = process.env.VORLD_APP_ID;
  
  if (!email || !password) {
    console.error('❌ Error: Email and password required\n');
    console.log('Usage:');
    console.log('  node scripts/request_otp.js <email> <password>');
    console.log('  OR set VORLD_EMAIL and VORLD_PASSWORD in .env and run:');
    console.log('  node scripts/request_otp.js\n');
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
    console.log('⏳ Requesting OTP...\n');
    
    // Try to login - if email not verified, will trigger OTP
    const loginUrl = 'https://vorld-auth.onrender.com/api/auth/register';
    
    const response = await axios.post(
      loginUrl,
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
    
    if (response.data.success) {
      // Check if OTP is required
      if (response.data.data && response.data.data.requiresOTP) {
        console.log('✅ OTP sent to your email!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📬 Check your email for the 6-digit verification code');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log('✨ Next Steps:');
        console.log('1. Check your email:', email);
        console.log('2. Copy the 6-digit OTP code');
        console.log('3. Run verification:');
        console.log('   npm run verify-email', email, '<YOUR_OTP>');
        console.log('   Example:');
        console.log('   npm run verify-email', email, '123456\n');
        
        console.log('⏰ Note: OTP codes usually expire after 10 minutes\n');
        
      } else {
        // Email already verified, can login
        console.log('✅ OTP sent to your email! Check your email for the 6-digit verification code\n');
        
        if (response.data.data.accessToken) {
          console.log('🎉 You\'re already logged in!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('Your JWT Token:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log(response.data.data.accessToken);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          
          console.log('📝 Add this to your .env file as:');
          console.log(`USER_TOKEN=${response.data.data.accessToken}\n`);
        }
      }
    } else {
      console.error('❌ Request failed:', response.data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('\n❌ Error requesting OTP:\n');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data?.error || error.response.data);
      
      if (error.response.status === 401) {
        console.error('\n💡 Tips:');
        console.error('   - Check your email and password are correct');
        console.error('   - Make sure you have a Vorld account at https://vorld.app');
      } else if (error.response.status === 404) {
        console.error('\n💡 Tips:');
        console.error('   - Email might not be registered');
        console.error('   - Sign up at https://thevorld.com first');
      }
      
      // Check if response mentions OTP already sent
      const errorMsg = error.response.data?.error || '';
      if (errorMsg.toLowerCase().includes('otp')) {
        console.error('\n📬 If OTP was already sent, check your email and run:');
        console.error('   npm run verify-email', email, '<YOUR_OTP>');
      }
      
    } else if (error.request) {
      console.error('Network error:', error.message);
      console.error('\n💡 Tips:');
      console.error('   - Check your internet connection');
      console.error('   - The Vorld API endpoint might be different');
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

requestOTP();

