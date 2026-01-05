const cron = require('node-cron');
const prisma = require('../config/prisma');

const initReminders = () => {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Running reminder check...');
        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        try {
            // Find appointments in the next 24 hours that haven't been notified (handled by custom logic if needed, 
            // but here we just check time. To avoid spam, we might need a flag 'reminderSent' in Appointment model.
            // For now, let's just log or send a notification if it's EXACTLY around the 24h mark or 1h mark.
            // A better approach is to check appointments start >= now+23h && start <= now+25h for "1 day before"
            // or start >= now+50min && start <= now+70min for "1 hour before"

            // Let's implement "1 day before" reminder
            const startRange = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
            const endRange = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

            const appointments = await prisma.appointment.findMany({
                where: {
                    scheduledAt: {
                        gte: startRange,
                        lte: endRange
                    }
                },
                include: {
                    ticket: { select: { title: true } },
                    itSupport: { select: { id: true, name: true } }
                }
            });

            for (const app of appointments) {
                // Send notification to IT
                await prisma.notification.create({
                    data: {
                        userId: app.itSupportId,
                        title: "Appointment Reminder",
                        message: `Reminder: You have an appointment for ticket "${app.ticket.title}" tomorrow at ${new Date(app.scheduledAt).toLocaleTimeString()}`,
                        type: "reminder",
                        ticketId: app.ticketId
                    }
                });

                // If we want to notify User too, we'd need user ID from ticket
                // (Assuming we query it)
            }

        } catch (err) {
            console.error('Reminder cron error:', err);
        }
    });
};

module.exports = initReminders;
