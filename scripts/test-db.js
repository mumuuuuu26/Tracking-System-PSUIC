
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to the database.');
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users.`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Failed to connect to database:', e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
