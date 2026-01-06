
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const categories = await prisma.category.findMany();
        console.log('Categories:', categories);

        const rooms = await prisma.room.findMany();
        console.log('Rooms:', rooms);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
