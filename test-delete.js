const prisma = require('./config/prisma');

async function testDeleteUser(userId) {
  try {
    console.log("Starting deletion for user:", userId);

    // 1. Unassign tickets assigned TO this user (IT Support role)
    await prisma.ticket.updateMany({
      where: { assignedToId: userId },
      data: { assignedToId: null, status: 'not_start' }
    });
    console.log("Step 1 done");

    // 3. Delete all Notifications belonging to this user
    await prisma.notification.deleteMany({
      where: { userId: userId }
    });
    console.log("Step 3 done");

    // 4. Delete Personal Tasks
    await prisma.personalTask.deleteMany({
      where: { userId: userId }
    });
    console.log("Step 4 done");

    // 5. Nullify Activity Logs
    await prisma.activityLog.updateMany({
      where: { updatedById: userId },
      data: { updatedById: null }
    });
    console.log("Step 5 done");

    // 7. Delete Tickets CREATED by this user
    const userTickets = await prisma.ticket.findMany({
      where: { createdById: userId },
      select: { id: true }
    });
    const ticketIds = userTickets.map(t => t.id);

    if (ticketIds.length > 0) {
      await prisma.notification.deleteMany({
        where: { ticketId: { in: ticketIds } }
      });
      console.log("Step 7a done");
    }

    await prisma.ticket.deleteMany({
      where: { createdById: userId }
    });
    console.log("Step 7b done - Tickets deleted");

    // 8. Delete the User
    await prisma.user.delete({
      where: { id: userId }
    });
    console.log("Step 8 done - User deleted");

  } catch (err) {
    console.error("Error during deletion:", err);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  const users = await prisma.user.findMany({ 
    take: 5,
    select: { id: true, email: true, ticketsCreated: { select: { id: true } } }
  });
  console.log("Available users:", JSON.stringify(users, null, 2));

  if (users.length > 1) {
    // try to delete the last user
    await testDeleteUser(users[users.length - 1].id);
  }
}
run();
