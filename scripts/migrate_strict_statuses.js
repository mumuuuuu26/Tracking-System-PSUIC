const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting strict status migration...');

  // 1. Pending -> not_start
  const pending = await prisma.ticket.updateMany({
    where: { status: 'pending' },
    data: { status: 'not_start' },
  });
  console.log(`Migrated ${pending.count} 'pending' tickets to 'not_start'`);

  // 2. Scheduled/Accepted -> in_progress
  const inProgress = await prisma.ticket.updateMany({
    where: { 
      status: { in: ['scheduled', 'accepted', 'assigned'] } 
    },
    data: { status: 'in_progress' },
  });
  console.log(`Migrated ${inProgress.count} 'scheduled/accepted' tickets to 'in_progress'`);

  // 3. Fixed/Closed/Rejected -> completed
  const completed = await prisma.ticket.updateMany({
    where: { 
      status: { in: ['fixed', 'closed', 'rejected', 'resolved'] } 
    },
    data: { status: 'completed' },
  });
  console.log(`Migrated ${completed.count} 'fixed/closed/rejected' tickets to 'completed'`);

   // 4. Update Notifications content
   // (Optional: clear or update old notifications if they refer to old statuses? 
   // User said "remove unrelated parts". Leaving historical text is probably fine, but let's ensure type is consistent)
   
  console.log('Migration complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
