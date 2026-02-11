const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");

// Get Admin Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [ticketCount, itStaffCount, roomCount, equipmentCount] =
      await Promise.all([
        prisma.ticket.count(),
        prisma.user.count({ where: { role: "it_support", enabled: true } }),
        prisma.room.count(),
        prisma.equipment.count(),
      ]);

    // Calculate Resolution Rate
    const totalFixed = await prisma.ticket.count({
      where: { status: "completed" },
    });
    const resolutionRate = ticketCount > 0 ? Math.round((totalFixed / ticketCount) * 100) : 0;

    res.json({
      ticketCount,
      itStaffCount,
      roomCount,
      equipmentCount,
      resolutionRate, // [NEW]
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: "Server Error: Get Stats Failed" });
  }
};

// Get IT Staff List with Status
// getITStaff removed

// getITStaffStats removed

