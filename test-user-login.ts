// Test User Login with Supabase
// Run with: npx tsx --env-file=.env test-user-login.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

console.log('🔍 Testing User Login...\n');

async function testUserLogin() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test login with the created user
    console.log('Attempting to login with:');
    console.log('Email: sriharsha87@gmail.com');
    console.log('Password: Test123\n');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'sriharsha87@gmail.com',
      password: 'Test123',
    });

    if (error) {
      console.error('❌ Login failed:', error.message);
      return;
    }

    console.log('✅ Login successful!\n');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
    console.log('Email Confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
    console.log('Created At:', data.user?.created_at);
    console.log('\nSession Token:', data.session?.access_token?.substring(0, 50) + '...');

    // Check if user profile exists in database
    console.log('\n🔍 Checking user profile in database...');
    const { data: profile, error: profileError } = await supabase
      .from('user')
      .select('*')
      .eq('email', 'sriharsha87@gmail.com')
      .single();

    if (profileError) {
      console.log('❌ No user profile found in database');
      console.log('Note: User exists in Supabase Auth but not in User table');
      console.log('This is expected - profile will be created on first app login');
    } else {
      console.log('✅ User profile found:');
      console.log('Profile ID:', profile.id);
      console.log('Curriculum:', profile.curriculum);
      console.log('Grade:', profile.grade);
      console.log('Subjects:', profile.subjects);
    }

    // Sign out
    await supabase.auth.signOut();
    console.log('\n✅ Signed out successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUserLogin()
  .catch(console.error)
  .finally(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  });
