const prisma = require("../config/prisma");
const { listGoogleEvents } = require("../controllers/googleCalendar");
const { logger } = require("./logger");

exports.syncUserCalendar = async (userId, googleCalendarId) => {
    logger.info(`[SyncService] Starting sync for User ${userId} with Calendar ID: ${googleCalendarId}`);

    if (!googleCalendarId) {
        throw new Error("Google Calendar ID is missing");
    }

    // Sync from 3 MONTHS AGO to ensure full context and overlap
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setDate(end.getDate() + 90); // 3 months lookahead

    // 1. Fetch events from Google
    const events = await listGoogleEvents(start, end, googleCalendarId);

    // 2. Prepare data for bulk insertion
    const tasksToCreate = events.map(event => {
        const isFullDay = !!event.start.date;

        // Handle Start/End Times
        let startDate, endDate;
        if (isFullDay) {
            startDate = new Date(event.start.date);
            endDate = new Date(event.end.date);
        } else {
            startDate = new Date(event.start.dateTime);
            endDate = new Date(event.end.dateTime);
        }

        return {
            userId: userId,
            title: event.summary || '(No Title)',
            description: [
                `Imported from Google Calendar (${googleCalendarId})`,
                event.location ? `📍 ${event.location}` : null,
                event.description || ''
            ].filter(Boolean).join('\n'),

            date: startDate,
            startTime: startDate,
            endTime: endDate,
            color: isFullDay ? '#10B981' : '#4285F4',
            isCompleted: false
        };
    });

    // 3. ATOMIC Transaction: Delete old range AND Insert new data
    await prisma.$transaction([
        prisma.personalTask.deleteMany({
            where: {
                userId: userId,
                date: { gte: start }
            }
        }),
        prisma.personalTask.createMany({
            data: tasksToCreate
        })
    ]);

    logger.info(`[SyncService] Successfully synced ${tasksToCreate.length} events.`);
    return tasksToCreate.length;
};
