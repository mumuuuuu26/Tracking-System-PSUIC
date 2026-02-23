const prisma = require('./config/prisma');

async function checkMissingCascades() {
  try {
    const user = await prisma.user.create({
      data: { email: "test_fk_image@psu.ac.th", name: "FK Image Test", role: "user" }
    });
    const room = await prisma.room.findFirst() || await prisma.room.create({ data: { roomNumber: 'FK2' }});
    
    const ticket = await prisma.ticket.create({
      data: {
        title: "Test FK Image",
        description: "Test",
        createdById: user.id,
        roomId: room.id,
      }
    });

    await prisma.image.create({
      data: {
        ticketId: ticket.id,
        asset_id: "test",
        public_id: "test",
        url: "test",
        secure_url: "test"
      }
    });

    console.log("Created ticket with image");

    // Manually run removeUser logic
    const userTickets = await prisma.ticket.findMany({ where: { createdById: user.id }, select: { id: true } });
    const ticketIds = userTickets.map(t => t.id);
    
    if (ticketIds.length > 0) {
      await prisma.notification.deleteMany({ where: { ticketId: { in: ticketIds } } });
    }

    console.log("Deleting tickets...");
    await prisma.ticket.deleteMany({
      where: { createdById: user.id }
    });

    console.log("Tickets deleted. Deleting user...");
    await prisma.user.delete({
      where: { id: user.id }
    });

    console.log("Success. MySQL DB has Cascade configured.");
  } catch (err) {
    console.error("Failed -> Missing CASCADE constraint?", err);
  } finally {
    await prisma.$disconnect();
  }
}

checkMissingCascades();
