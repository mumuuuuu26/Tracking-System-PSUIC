const prisma = require("../config/prisma");

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
    console.error(err);
    res.status(500).json({ message: "Server Error: Get Stats Failed" });
  }
};

// Get IT Staff List with Status
exports.getITStaff = async (req, res) => {
  try {
    // Fetch all IT support staff
    const staff = await prisma.user.findMany({
      where: { role: "it_support", enabled: true },
      select: {
        id: true,
        name: true,
        email: true,
        picture: true,
        department: true,
        phoneNumber: true,
      },
      orderBy: { name: 'asc' }
    });

    // Check their current workload to determine status
    const staffWithStatus = await Promise.all(
      staff.map(async (user) => {


        // Count active tickets assigned to this user
        const activeTickets = await prisma.ticket.count({
          where: {
            assignedToId: user.id,
            status: { in: ["in_progress"] },
          },
        });

        // Status Priority: On Leave > Busy > Available
        let status = "Available";
        if (activeTickets > 0) {
          status = "Busy";
        }

        // Get the latest ticket they are working on if busy
        let currentTicket = null;
        if (status === "Busy") {
          currentTicket = await prisma.ticket.findFirst({
            where: {
              assignedToId: user.id,
              status: { in: ["in_progress"] },
            },
            select: { id: true, title: true },
          });
        }

        // Return user with calculated status
        return {
          ...user,
          status,
          currentTicket,
        };
      })
    );

    res.json(staffWithStatus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error: Get IT Staff Failed" });
  }
};

exports.getITStaffStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);



    // Count Active IT Staff (Not on leave)
    const active = await prisma.user.count({
      where: {
        role: "it_support",
        enabled: true,
        // NOT: { availabilities: ... } // dependency removed
      }
    });

    res.json({ active });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

