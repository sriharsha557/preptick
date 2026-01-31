// Script to create admin user in Supabase

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const supabaseUrl = 'https://mqeenbberuxzqtngkygh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xZWVuYmJlcnV4enF0bmdreWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjA5MDIsImV4cCI6MjA4NTIzNjkwMn0.T3zzt3JqRYNnMgBcEehHj0qwaizCAPVPr4fTS8rt6RE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('Creating admin user...');

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@preptick.com',
      password: 'Admin@123',
      options: {
        emailRedirectTo: undefined,
        data: {
          curriculum: 'CBSE',
          grade: 10,
        }
      }
    });

    if (authError) {
      console.error('Supabase Auth Error:', authError.message);
      
      // Try to sign in if user already exists
      console.log('Trying to sign in with existing user...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@preptick.com',
        password: 'Admin@123',
      });

      if (signInError) {
        console.error('Sign in error:', signInError.message);
        console.log('\n⚠️  User might already exist. Try logging in with:');
        console.log('   Email: admin@preptick.com');
        console.log('   Password: Admin@123');
        return;
      }

      console.log('✅ Successfully signed in with existing user!');
      console.log('User ID:', signInData.user?.id);
      return;
    }

    if (!authData.user) {
      console.error('No user data returned');
      return;
    }

    console.log('✅ User created in Supabase Auth');
    console.log('User ID:', authData.user.id);
    console.log('Email:', authData.user.email);

    // Create user profile in database
    try {
      const user = await prisma.user.create({
        data: {
          id: authData.user.id,
          email: 'admin@preptick.com',
          passwordHash: '', // Supabase handles password
          curriculum: 'CBSE',
          grade: 10,
          subjects: JSON.stringify(['Mathematics', 'Science', 'English']),
          createdAt: new Date(),
          lastLogin: new Date(),
        },
      });

      console.log('✅ User profile created in database');
      console.log('Profile ID:', user.id);
    } catch (dbError: any) {
      if (dbError.code === 'P2002') {
        console.log('⚠️  User profile already exists in database');
      } else {
        console.error('Database error:', dbError.message);
      }
    }

    console.log('\n✅ Admin user setup complete!');
    console.log('\nLogin credentials:');
    console.log('  Email: admin@preptick.com');
    console.log('  Password: Admin@123');
    console.log('\nYou can now login at: http://localhost:5173/login');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
