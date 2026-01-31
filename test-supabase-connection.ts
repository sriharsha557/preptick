// Test Supabase Connection using Supabase Client
// Run with: npx tsx test-supabase-connection.ts

import { createClient } from '@supabase/supabase-js';

// Environment variables (loaded automatically by tsx from .env)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

console.log('🔍 Testing Supabase Connection...\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET');
console.log('');

async function testSupabaseConnection() {
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created\n');

    // Test 1: Check connection by querying syllabus topics
    console.log('Test 1: Querying syllabus_topic table...');
    const { data: topics, error: topicsError } = await supabase
      .from('syllabus_topic')
      .select('id, name, curriculum, grade, subject')
      .limit(5);

    if (topicsError) {
      console.error('❌ Error querying topics:', topicsError);
    } else {
      console.log(`✅ Found ${topics?.length || 0} topics:`);
      topics?.forEach(topic => {
        console.log(`   - ${topic.name} (${topic.curriculum}, Grade ${topic.grade}, ${topic.subject})`);
      });
    }
    console.log('');

    // Test 2: Count questions
    console.log('Test 2: Counting questions...');
    const { count: questionCount, error: questionError } = await supabase
      .from('question')
      .select('*', { count: 'exact', head: true });

    if (questionError) {
      console.error('❌ Error counting questions:', questionError);
    } else {
      console.log(`✅ Found ${questionCount || 0} questions in database`);
    }
    console.log('');

    // Test 3: Count users
    console.log('Test 3: Counting users...');
    const { count: userCount, error: userError } = await supabase
      .from('user')
      .select('*', { count: 'exact', head: true });

    if (userError) {
      console.error('❌ Error counting users:', userError);
    } else {
      console.log(`✅ Found ${userCount || 0} users in database`);
    }
    console.log('');

    // Test 4: Check if tables exist
    console.log('Test 4: Checking if required tables exist...');
    const tables = [
      'user',
      'syllabus_topic',
      'question',
      'test',
      'test_question',
      'test_session',
      'test_response',
      'evaluation',
      'performance_report',
      'improvement_suggestion'
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ Table '${table}' - Error: ${error.message}`);
      } else {
        console.log(`   ✅ Table '${table}' exists`);
      }
    }
    console.log('');

    console.log('🎉 Supabase connection test completed!\n');

  } catch (error) {
    console.error('❌ Supabase connection test failed:');
    console.error(error);
    
    console.log('\n📋 Troubleshooting tips:');
    console.log('1. Check if Supabase project is active (not paused)');
    console.log('2. Verify NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY in .env');
    console.log('3. Check if database tables are created in Supabase dashboard');
    console.log('4. Verify network connectivity to Supabase');
    console.log('5. Check Supabase project settings for correct credentials');
  }
}

// Run the test
testSupabaseConnection()
  .catch(console.error)
  .finally(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  });
