// Check if admin user exists in database

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminUser() {
  try {
    console.log('Checking for admin user in database...\n');

    const user = await prisma.user.findUnique({
      where: { email: 'admin@preptick.com' },
    });

    if (user) {
      console.log('✅ Admin user found in database!');
      console.log('User ID:', user.id);
      console.log('Email:', user.email);
      console.log('Curriculum:', user.curriculum);
      console.log('Grade:', user.grade);
      console.log('Subjects:', user.subjects);
      console.log('Created:', user.createdAt);
    } else {
      console.log('❌ Admin user NOT found in database');
      console.log('\nThe user exists in Supabase Auth but not in the database.');
      console.log('Creating user profile in database...\n');

      // You'll need to get the user ID from Supabase
      console.log('Please provide the Supabase user ID to create the profile.');
      console.log('You can find it in Supabase Dashboard > Authentication > Users');
    }

    // Check all users
    const allUsers = await prisma.user.findMany();
    console.log(`\nTotal users in database: ${allUsers.length}`);
    
    if (allUsers.length > 0) {
      console.log('\nAll users:');
      allUsers.forEach(u => {
        console.log(`- ${u.email} (${u.curriculum}, Grade ${u.grade})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();
