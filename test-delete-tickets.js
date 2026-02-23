const prisma = require('./config/prisma');

async function testDeleteUserWithTickets() {
  try {
    // create a user
    const user = await prisma.user.create({
      data: {
        email: "test_delete_with_tickets@psu.ac.th",
        name: "Test Delete User",
        role: "user"
      }
    });
    
    // create a ticket for this user
    // Look at schema: Ticket needs title, description, createdById, roomId
    const room = await prisma.room.findFirst() || await prisma.room.create({ data: { roomNumber: 'TEST1' }});
    
    const ticket = await prisma.ticket.create({
      data: {
        title: "Test Ticket",
        description: "Test",
        createdById: user.id,
        roomId: room.id,
      }
    });

    console.log("Created user", user.id, "and ticket", ticket.id);

    // Now delete the user
    const { removeUser } = require('./controllers/user');
    
    // mock req, res, next
    const req = { params: { id: user.id } };
    let jsonCalled = false;
    let jsonRes = null;
    const res = { json: (data) => { jsonCalled = true; jsonRes = data; } };
    const next = (err) => { console.error("Error from next:", err); };

    console.log("Calling removeUser");
    await removeUser(req, res, next);
    
    console.log("removeUser completed res.json called:", jsonCalled, "with:", jsonRes);

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteUserWithTickets();
