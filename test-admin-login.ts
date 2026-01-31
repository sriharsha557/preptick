// Test admin login with Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqeenbberuxzqtngkygh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZWVuYmJlcnV4enF0bmdreWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjA5MDIsImV4cCI6MjA4NTIzNjkwMn0.T3zzt3JqRYNnMgBcEehHj0qwaizCAPVPr4fTS8rt6RE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAdminLogin() {
  console.log('🔐 Testing Admin Login...\n');
  
  const email = 'admin@preptick.com';
  const password = 'Admin@123';
  
  console.log(`Email: ${email}`);
  console.log(`Supabase URL: ${supabaseUrl}\n`);
  
  try {
    // Attempt login
    console.log('Attempting to sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Login failed!');
      console.error('Error:', error.message);
      console.error('Status:', error.status);
      console.error('\nPossible issues:');
      
      if (error.message.includes('Invalid login credentials')) {
        console.error('  - Wrong email or password');
        console.error('  - User does not exist in Supabase Auth');
        console.error('  - Password was changed');
      } else if (error.message.includes('Email not confirmed')) {
        console.error('  - Email verification required');
        console.error('  - Go to Supabase Dashboard > Authentication > Providers > Email');
        console.error('  - Disable "Confirm email" for local testing');
      } else {
        console.error('  - Check Supabase project status');
        console.error('  - Verify API keys are correct');
      }
      
      return;
    }
    
    if (data.session) {
      console.log('✅ Login successful!\n');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
      console.log('Email Confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('Created At:', data.user.created_at);
      console.log('Last Sign In:', data.user.last_sign_in_at);
      console.log('\nSession:');
      console.log('Access Token:', data.session.access_token.substring(0, 50) + '...');
      console.log('Expires At:', new Date(data.session.expires_at! * 1000).toLocaleString());
      
      // Sign out
      await supabase.auth.signOut();
      console.log('\n✅ Signed out successfully');
    } else {
      console.error('❌ No session returned');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testAdminLogin();
