import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
await prisma.discussionReply.deleteMany({});
console.log('deleted');
await prisma.$disconnect();
