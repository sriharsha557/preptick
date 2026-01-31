// Add admin user profile to database
// Run this after creating the user in Supabase Auth

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mqeenbberuxzqtngkygh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZWVuYmJlcnV4enF0bmdreWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjA5MDIsImV4cCI6MjA4NTIzNjkwMn0.T3zzt3JqRYNnMgBcEehHj0qwaizCAPVPr4fTS8rt6RE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const prisma = new PrismaClient();

async function addAdminProfile() {
  try {
    console.log('Signing in to get user ID...\n');

    // Sign in to get the user ID
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@preptick.com',
      password: 'Admin@123',
    });

    if (signInError) {
      console.error('❌ Sign in error:', signInError.message);
      console.log('\nMake sure the admin user exists in Supabase Auth with:');
      console.log('  Email: admin@preptick.com');
      console.log('  Password: Admin@123');
      return;
    }

    if (!signInData.user) {
      console.error('❌ No user data returned');
      return;
    }

    console.log('✅ Successfully signed in!');
    console.log('User ID:', signInData.user.id);
    console.log('Email:', signInData.user.email);

    // Check if profile already exists
    const existingProfile = await prisma.user.findUnique({
      where: { id: signInData.user.id },
    });

    if (existingProfile) {
      console.log('\n✅ User profile already exists in database!');
      console.log('You can now login at: http://localhost:5173/login');
      return;
    }

    // Create user profile in database
    console.log('\nCreating user profile in database...');
    
    const user = await prisma.user.create({
      data: {
        id: signInData.user.id,
        email: 'admin@preptick.com',
        passwordHash: '', // Supabase handles password
        curriculum: 'CBSE',
        grade: 10,
        subjects: JSON.stringify(['Mathematics', 'Science', 'English']),
        createdAt: new Date(),
        lastLogin: new Date(),
      },
    });

    console.log('✅ User profile created successfully!');
    console.log('\nLogin credentials:');
    console.log('  Email: admin@preptick.com');
    console.log('  Password: Admin@123');
    console.log('\nYou can now login at: http://localhost:5173/login');

  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('✅ User profile already exists in database!');
      console.log('You can now login at: http://localhost:5173/login');
    } else {
      console.error('❌ Error:', error.message || error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

addAdminProfile();
