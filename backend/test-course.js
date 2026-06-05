import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({ take: 1 });
    if (!users.length) return console.log('No users found');

    const course = await prisma.course.create({
      data: {
        title: 'Debug Course',
        slug: 'debug-course-123',
        description: 'Test',
        learningOutcomes: [],
        createdBy: users[0].id
      }
    });
    console.log('Success:', course);
  } catch (e) {
    console.error('Error creating course:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
