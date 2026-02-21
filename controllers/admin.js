const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");

// Get Admin Dashboard Stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [ticketCount, itStaffCount, roomCount, equipmentCount] =
      await Promise.all([
        // [FIX] Only count non-deleted tickets for dashboard display
        prisma.ticket.count({ where: { isDeleted: false } }),
        prisma.user.count({ where: { role: "it_support", enabled: true } }),
        prisma.room.count(),
        prisma.equipment.count(),
      ]);

    // [FIX] Resolution rate: completed / (non-deleted, non-rejected) for accurate %
    const [totalFixed, totalEligible] = await Promise.all([
      prisma.ticket.count({ where: { status: "completed", isDeleted: false } }),
      prisma.ticket.count({ where: { isDeleted: false, status: { not: "rejected" } } }),
    ]);
    const resolutionRate = totalEligible > 0 ? Math.round((totalFixed / totalEligible) * 100) : 0;

    res.json({
      ticketCount,
      itStaffCount,
      roomCount,
      equipmentCount,
      resolutionRate,
    });
  } catch (err) {
    next(err);
  }
};

// Get IT Staff List with Status
// getITStaff removed

// getITStaffStats removed

