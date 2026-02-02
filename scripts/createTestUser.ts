import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'test',
        name: 'Test User',
        curriculum: 'CBSE',
        grade: 10,
        subjects: JSON.stringify(['Mathematics', 'Science'])
      }
    });
    console.log('User created:', user.id);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('User already exists');
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
