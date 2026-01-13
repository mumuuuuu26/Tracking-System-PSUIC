
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.knowledgeBase.updateMany({
        data: {
            viewCount: 0,
            helpful: 0
        }
    });
    console.log("Reset KB stats successfully");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
