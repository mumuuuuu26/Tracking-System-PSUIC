const prisma = require('./config/prisma');
const { removeUser } = require('./controllers/user');

async function testExact() {
  const user1 = await prisma.user.create({ data: { email: 'user1@psu.ac.th', role: 'user' } });
  const user2 = await prisma.user.create({ data: { email: 'user2@psu.ac.th', role: 'user' } });
  
  const room = await prisma.room.findFirst() || await prisma.room.create({ data: { roomNumber: 'EX1' }});
  
  // ticket created by user1
  const t1 = await prisma.ticket.create({ data: { title: 'T1', description: 'T1', createdById: user1.id, roomId: room.id } });
  // ticket created by user2
  const t2 = await prisma.ticket.create({ data: { title: 'T2', description: 'T2', createdById: user2.id, roomId: room.id } });
  
  // mock route
  const req = { params: { id: user1.id } };
  let jsonRes = null;
  const res = { json: (data) => { jsonRes = data; }, status: (code) => res };
  const next = (err) => { console.error("Error from next:", err); };
  
  await removeUser(req, res, next);
  
  // Check that user2 and t2 still exist
  const checkUser2 = await prisma.user.findUnique({ where: { id: user2.id } });
  const checkT2 = await prisma.ticket.findUnique({ where: { id: t2.id } });
  
  console.log("Delete result:", jsonRes);
  console.log("User 2 exists?", !!checkUser2);
  console.log("Ticket 2 exists?", !!checkT2);
  
  // cleanup
  await prisma.ticket.deleteMany({ where: { createdById: user2.id } });
  await prisma.user.delete({ where: { id: user2.id } });
}
testExact().catch(console.error).finally(() => prisma.$disconnect());
