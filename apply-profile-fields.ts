// Apply profile fields to existing database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyProfileFields() {
  try {
    console.log('Adding profile fields to User table...\n');

    // Execute raw SQL to add columns
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "name" TEXT,
      ADD COLUMN IF NOT EXISTS "gender" TEXT,
      ADD COLUMN IF NOT EXISTS "schoolName" TEXT,
      ADD COLUMN IF NOT EXISTS "city" TEXT,
      ADD COLUMN IF NOT EXISTS "country" TEXT,
      ADD COLUMN IF NOT EXISTS "profilePicture" TEXT;
    `);

    console.log('✓ Profile fields added successfully');

    // Update existing users with default name
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "User" 
      SET "name" = COALESCE("name", 'Student')
      WHERE "name" IS NULL;
    `);

    console.log('✓ Updated existing users with default names');

    // Verify the changes
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        gender: true,
        schoolName: true,
        city: true,
        country: true,
        profilePicture: true,
      },
    });

    console.log(`\n✓ Verified: Found ${users.length} users with new profile fields`);
    console.log('\nSample user data:');
    if (users.length > 0) {
      console.log(JSON.stringify(users[0], null, 2));
    }

    console.log('\n✅ Profile fields migration completed successfully!');
  } catch (error) {
    console.error('❌ Error applying profile fields:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyProfileFields();
