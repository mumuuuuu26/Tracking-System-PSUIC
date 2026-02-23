const prisma = require('./config/prisma');
const { removeUser } = require('./controllers/user');

async function testAll() {
  const users = await prisma.user.findMany({ where: { id: { not: 1 } } });
  let failed = 0;
  for (const user of users) {
    try {
      const req = { params: { id: user.id } };
      let jsonRes = null;
      let errorThrown = null;
      const res = { json: (data) => { jsonRes = data; } };
      const next = (err) => { errorThrown = err; };
      
      await removeUser(req, res, next);
      if (errorThrown) {
        console.log(`User ${user.id} (${user.email}) FAILED:`, errorThrown);
        failed++;
      } else {
        console.log(`User ${user.id} (${user.email}) OK`);
      }
    } catch (e) {
      console.log(`User ${user.id} (${user.email}) CATCH:`, e);
      failed++;
    }
  }
  console.log(`Total failed: ${failed}`);
}

testAll().catch(console.error).finally(() => prisma.$disconnect());
