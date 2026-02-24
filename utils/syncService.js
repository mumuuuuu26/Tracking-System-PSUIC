const prisma = require("../config/prisma");
const { listGoogleEvents } = require("../controllers/googleCalendar");
const { logger } = require("./logger");

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const toDateOrNull = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return isValidDate(parsed) ? parsed : null;
};

const normalizeGoogleEventRange = (event) => {
  const hasAllDayStart = Boolean(event?.start?.date);
  const hasTimedStart = Boolean(event?.start?.dateTime);

  if (!hasAllDayStart && !hasTimedStart) {
    return null;
  }

  if (hasAllDayStart) {
    const startDate = toDateOrNull(event.start.date);
    if (!startDate) return null;

    // Google all-day end is exclusive; fallback to +1 day if missing/invalid.
    let endDate = toDateOrNull(event?.end?.date);
    if (!endDate || endDate <= startDate) {
      endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    }
    return { startDate, endDate, isFullDay: true };
  }

  const startDate = toDateOrNull(event?.start?.dateTime);
  if (!startDate) return null;

  let endDate = toDateOrNull(event?.end?.dateTime);
  if (!endDate || endDate <= startDate) {
    endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
  }

  return { startDate, endDate, isFullDay: false };
};

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
  const tasksToCreate = [];
  let skippedInvalidEvents = 0;

  for (const event of events) {
    const normalizedRange = normalizeGoogleEventRange(event);
    if (!normalizedRange) {
      skippedInvalidEvents += 1;
      continue;
    }

    const { startDate, endDate, isFullDay } = normalizedRange;
    tasksToCreate.push({
      userId,
      title: event.summary || "(No Title)",
      description: [
        `Imported from Google Calendar (${googleCalendarId})`,
        event.location ? `📍 ${event.location}` : null,
        event.description || "",
      ]
        .filter(Boolean)
        .join("\n"),
      date: startDate,
      startTime: startDate,
      endTime: endDate,
      color: isFullDay ? "#10B981" : "#4285F4",
      isCompleted: false,
    });
  }

  if (skippedInvalidEvents > 0) {
    logger.warn(
      `[SyncService] Skipped ${skippedInvalidEvents} malformed Google events for User ${userId}.`,
    );
  }

  // 3. ATOMIC Transaction: Delete old range AND Insert new data (if any)
  await prisma.$transaction(async (tx) => {
    await tx.personalTask.deleteMany({
      where: {
        userId,
        date: { gte: start },
      },
    });

    if (tasksToCreate.length > 0) {
      await tx.personalTask.createMany({
        data: tasksToCreate,
        skipDuplicates: true,
      });
    }
  });

  logger.info(`[SyncService] Successfully synced ${tasksToCreate.length} events.`);
  return tasksToCreate.length;
};
