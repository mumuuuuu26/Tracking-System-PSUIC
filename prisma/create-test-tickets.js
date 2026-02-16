const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Creating test tickets...");

    const user = await prisma.user.findFirst({ where: { role: 'user' } });
    const room = await prisma.room.findFirst();
    const category = await prisma.category.findFirst();

    if (!user || !room || !category) {
        console.error("Missing seed data (user/room/cat)");
        return;
    }

    // Ticket for Reject testing
    const t1 = await prisma.ticket.create({
        data: {
            title: "Test Ticket for Reject",
            description: "Please reject this ticket",
            urgency: "Low",
            status: "not_start", // Pending
            createdById: user.id,
            roomId: room.id,
            categoryId: category.id
        }
    });
    console.log(`Created pending ticket: ${t1.id}`);

    // Ticket for Close testing (already assigned to IT1)
    const it = await prisma.user.findFirst({ where: { email: 'it1@psu.ac.th' } });
    if(it) {
        const t2 = await prisma.ticket.create({
            data: {
                title: "Test Ticket for Close",
                description: "Please close this ticket",
                urgency: "Medium",
                status: "in_progress",
                createdById: user.id,
                assignedToId: it.id,
                roomId: room.id,
                categoryId: category.id
            }
        });
        console.log(`Created in_progress ticket: ${t2.id} for IT: ${it.email}`);
    }

}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
