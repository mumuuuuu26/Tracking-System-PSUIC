const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function backfillSLA() {
    console.log("🚀 Starting Historical SLA Backfill...");

    // 1. Fetch all tickets that are completed or in_progress and have missing SLA data
    const tickets = await prisma.ticket.findMany({
        where: {
            OR: [
                { acceptedAt: null, status: 'in_progress' },
                { completedAt: null, status: 'completed' },
                { responseTime: null },
                { resolutionTime: null }
            ],
            isDeleted: false
        },
        include: { logs: true }
    });

    console.log(`Found ${tickets.length} tickets to process.`);

    let updatedCount = 0;

    for (const ticket of tickets) {
        let acceptedAt = ticket.acceptedAt;
        let completedAt = ticket.completedAt;
        let responseTime = ticket.responseTime;
        let resolutionTime = ticket.resolutionTime;

        // Sort logs by time
        const sortedLogs = ticket.logs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // Find Acceptance (Action: 'Accept')
        if (!acceptedAt) {
            const acceptLog = sortedLogs.find(l => l.action === 'Accept' || l.action.toLowerCase().includes('accept'));
            if (acceptLog) {
                acceptedAt = acceptLog.createdAt;
            }
        }

        // Find Completion (Action: 'Complete')
        if (!completedAt && ticket.status === 'completed') {
            const completeLog = sortedLogs.find(l => l.action === 'Complete' || l.action.toLowerCase().includes('complete'));
            if (completeLog) {
                completedAt = completeLog.createdAt;
            } else {
                // Fallback: use updatedAt if no complete log found for completed ticket
                completedAt = ticket.updatedAt;
            }
        }

        // Calculate Durations
        if (acceptedAt && !responseTime) {
            const diff = Math.floor((new Date(acceptedAt) - new Date(ticket.createdAt)) / 60000);
            responseTime = Math.max(0, diff);
        }

        if (completedAt && acceptedAt && !resolutionTime) {
            const diff = Math.floor((new Date(completedAt) - new Date(acceptedAt)) / 60000);
            resolutionTime = Math.max(0, diff);
        } else if (completedAt && !acceptedAt && !resolutionTime && ticket.status === 'completed') {
             // If never accepted but completed, resolution time is from create to complete
             const diff = Math.floor((new Date(completedAt) - new Date(ticket.createdAt)) / 60000);
             resolutionTime = Math.max(0, diff);
             // Assume response was 0 if they jumped to complete
             if (responseTime === null) responseTime = 0;
        }

        // Update if anything changed
        if (acceptedAt !== ticket.acceptedAt || 
            completedAt !== ticket.completedAt || 
            responseTime !== ticket.responseTime || 
            resolutionTime !== ticket.resolutionTime) {
            
            await prisma.ticket.update({
                where: { id: ticket.id },
                data: {
                    acceptedAt,
                    completedAt,
                    responseTime,
                    resolutionTime
                }
            });
            updatedCount++;
        }
    }

    console.log(`✅ Backfill complete. Updated ${updatedCount} tickets.`);
}

backfillSLA()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
