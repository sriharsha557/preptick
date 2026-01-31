// Test Supabase Database Connection
// Run with: npx tsx test-db-connection.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('🔍 Testing Supabase Database Connection...\n');

  try {
    // Test 1: Basic connection
    console.log('Test 1: Testing basic connection...');
    await prisma.$connect();
    console.log('✅ Successfully connected to database\n');

    // Test 2: Query syllabus topics
    console.log('Test 2: Querying syllabus topics...');
    const topics = await prisma.syllabusTopic.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        curriculum: true,
        grade: true,
        subject: true,
      },
    });
    console.log(`✅ Found ${topics.length} topics:`);
    topics.forEach(topic => {
      console.log(`   - ${topic.name} (${topic.curriculum}, Grade ${topic.grade}, ${topic.subject})`);
    });
    console.log('');

    // Test 3: Count questions
    console.log('Test 3: Counting questions in database...');
    const questionCount = await prisma.question.count();
    console.log(`✅ Found ${questionCount} questions in database\n`);

    // Test 4: Query users
    console.log('Test 4: Querying users...');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database\n`);

    // Test 5: Query tests
    console.log('Test 5: Querying tests...');
    const testCount = await prisma.test.count();
    console.log(`✅ Found ${testCount} tests in database\n`);

    // Test 6: Check database schema
    console.log('Test 6: Checking database tables...');
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   - ${table.tablename}`);
    });
    console.log('');

    console.log('🎉 All database connection tests passed!\n');
    console.log('Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));

  } catch (error) {
    console.error('❌ Database connection test failed:');
    console.error(error);
    
    if (error instanceof Error) {
      console.error('\nError details:');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }

    console.log('\n📋 Troubleshooting tips:');
    console.log('1. Check if DATABASE_URL is set in .env file');
    console.log('2. Verify Supabase credentials are correct');
    console.log('3. Ensure database schema is created (run: npx prisma db push)');
    console.log('4. Check if Supabase project is active and accessible');
    console.log('5. Verify network connectivity to Supabase');
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
testConnection()
  .catch(console.error)
  .finally(() => process.exit(0));
