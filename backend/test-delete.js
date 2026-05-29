import prisma from './src/config/db.config.js';

async function main() {
  try {
    const result = await prisma.userSkill.deleteMany({
      where: {
        userId: 'some-uuid',
        OR: [
          { id: 'JavaScript' },
          { skillTag: 'JavaScript' }
        ]
      }
    });
    console.log('Result:', result);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();