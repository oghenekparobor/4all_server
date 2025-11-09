#!/usr/bin/env node
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function verifyEmail() {
  console.log('📧 Verifying Email with OTP...\n');
  
  // Get parameters
  const email = process.env.VORLD_EMAIL || process.argv[2];
  const otp = process.argv[3] || process.argv[2]; // OTP can be 2nd or 3rd arg
  const vorldAppId = process.env.VORLD_APP_ID;
  
  if (!email || !otp) {
    console.error('❌ Error: Email and OTP required\n');
    console.log('Usage:');
    console.log('  node scripts/verify_email.js <email> <otp>');
    console.log('  OR set VORLD_EMAIL in .env and run:');
    console.log('  node scripts/verify_email.js <otp>\n');
    console.log('Example:');
    console.log('  node scripts/verify_email.js your@email.com 123456');
    console.log('  OR');
    console.log('  node scripts/verify_email.js 123456\n');
    process.exit(1);
  }
  
  if (!vorldAppId) {
    console.error('❌ Error: VORLD_APP_ID not set in .env\n');
    process.exit(1);
  }
  
  // Validate OTP format (should be 6 digits)
  if (!/^\d{6}$/.test(otp)) {
    console.warn('⚠️  Warning: OTP should be a 6-digit code\n');
  }
  
  try {
    console.log('📧 Email:', email);
    console.log('🔑 App ID:', vorldAppId);
    console.log('🔢 OTP:', otp);
    console.log('⏳ Verifying...\n');
    
    // Try the verify OTP endpoint
    const verifyUrl = 'https://vorld-auth.onrender.com/api/auth/verify-otp';
    
    const response = await axios.post(
      verifyUrl,
      {
        email: email,
        otp: otp
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Vorld-App-ID': vorldAppId
        }
      }
    );
    
    if (response.data.success) {
      console.log('✅ Email verified successfully!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Email verification complete!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      console.log('✨ Next Steps:');
      console.log('1. Now you can get your JWT token:');
      console.log('   npm run get-token\n');
      
      if (response.data.data) {
        console.log('📊 Response data:');
        console.log(JSON.stringify(response.data.data, null, 2));
      }
      
    } else {
      console.error('❌ Verification failed:', response.data.error || 'Unknown error');
      console.error('\n💡 Tips:');
      console.error('   - Check that you entered the OTP correctly');
      console.error('   - OTP codes usually expire after 10 minutes');
      console.error('   - Request a new OTP if this one has expired\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error verifying email:\n');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data?.error || error.response.data);
      
      if (error.response.status === 400) {
        console.error('\n💡 Tips:');
        console.error('   - OTP might be incorrect');
        console.error('   - OTP might have expired');
        console.error('   - Try requesting a new OTP');
      } else if (error.response.status === 404) {
        console.error('\n💡 Tips:');
        console.error('   - Email might not be registered');
        console.error('   - Check that you\'re using the correct email');
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

verifyEmail();

