const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkHistoricalData() {
    console.log("--- Checking Historical Ticket Data ---");
    const tickets = await prisma.ticket.findMany({
        where: { status: 'completed', isDeleted: false },
        take: 5,
        include: { logs: true }
    });

    tickets.forEach(t => {
        console.log(`Ticket #${t.id}: Status=${t.status}, Created=${t.createdAt}, Updated=${t.updatedAt}`);
        console.log(`- New Fields: acceptedAt=${t.acceptedAt}, completedAt=${t.completedAt}, resp=${t.responseTime}, resol=${t.resolutionTime}`);
        console.log("- Logs:");
        t.logs.forEach(l => {
            console.log(`  [${l.createdAt}] Action: ${l.action}, Detail: ${l.detail}`);
        });
        console.log("-------------------");
    });
}

checkHistoricalData()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
