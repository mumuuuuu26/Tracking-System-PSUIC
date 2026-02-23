const prisma = require('./config/prisma');

async function testCascadeConstraints() {
  try {
    const user = await prisma.user.create({
      data: { email: "test_fk@psu.ac.th", name: "FK Test", role: "user" }
    });
    const room = await prisma.room.findFirst() || await prisma.room.create({ data: { roomNumber: 'FK1' }});
    
    const ticket = await prisma.ticket.create({
      data: {
        title: "Test FK Ticket",
        description: "Test",
        createdById: user.id,
        roomId: room.id,
      }
    });

    // Create an activity log pointing to this ticket
    await prisma.activityLog.create({
      data: {
        ticketId: ticket.id,
        action: "created",
        updatedById: user.id
      }
    });

    console.log("Created user, ticket, and activity log.");

    // Now call the removeUser logic manually
    await prisma.ticket.updateMany({ where: { assignedToId: user.id }, data: { assignedToId: null, status: 'not_start' } });
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.personalTask.deleteMany({ where: { userId: user.id } });
    await prisma.activityLog.updateMany({ where: { updatedById: user.id }, data: { updatedById: null } });
    
    const userTickets = await prisma.ticket.findMany({ where: { createdById: user.id }, select: { id: true } });
    const ticketIds = userTickets.map(t => t.id);
    
    if (ticketIds.length > 0) {
      await prisma.notification.deleteMany({ where: { ticketId: { in: ticketIds } } });
    }

    console.log("Attempting to delete tickets...");
    await prisma.ticket.deleteMany({
      where: { createdById: user.id }
    });

    console.log("Tickets deleted. Deleting user...");
    await prisma.user.delete({
      where: { id: user.id }
    });

    console.log("Success.");
  } catch (err) {
    console.error("Failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testCascadeConstraints();
