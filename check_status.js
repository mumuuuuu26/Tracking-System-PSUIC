
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tickets = await prisma.ticket.findMany({
        select: { status: true }
    });

    const statuses = {};
    tickets.forEach(t => {
        statuses[t.status] = (statuses[t.status] || 0) + 1;
    });

    console.log('Ticket Statuses in DB:', statuses);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
