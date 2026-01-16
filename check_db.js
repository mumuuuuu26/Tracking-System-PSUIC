const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Checking distinct ticket statuses...");
    const tickets = await prisma.ticket.groupBy({
        by: ['status'],
        _count: {
            status: true
        }
    });

    console.log("Found statuses:", tickets);

    // also check for any null or weird statuses
    const invalidTickets = await prisma.ticket.findMany({
        where: {
            status: {
                notIn: ['pending', 'in_progress', 'fixed', 'rejected', 'scheduled', 'closed']
            }
        }
    });

    if (invalidTickets.length > 0) {
        console.log("WARNING: Found tickets with unexpected statuses:", invalidTickets);
    } else {
        console.log("✅ All tickets have valid known statuses.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
