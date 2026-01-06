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

    res.json({
      ticketCount,
      itStaffCount,
      roomCount,
      equipmentCount,
    });
  } catch (err) {
    console.log(err);
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

        // Simple status logic: If working on a ticket -> Busy, else Available
        // In future could add "On Leave" check from another table
        const status = activeTickets > 0 ? "Busy" : "Available";

        // Get the latest ticket they are working on if busy
        let currentTicket = null;
        if (status === "Busy") {
          currentTicket = await prisma.ticket.findFirst({
            where: {
              assignedToId: user.id,
              status: "in_progress",
            },
            select: { id: true, title: true },
          });
        }

        return {
          ...user,
          status,
          currentTicket,
        };
      })
    );

    res.json(staffWithStatus);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error: Get IT Staff Failed" });
  }
};

exports.getITStaffStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check IT Staff on Leave
    const onLeave = await prisma.user.count({
      where: {
        role: "it_support",
        availabilities: {
          some: {
            date: { gte: today },
            status: "leave"
          }
        }
      }
    });

    // Count Active IT Staff (Not on leave)
    const active = await prisma.user.count({
      where: {
        role: "it_support",
        enabled: true,
        NOT: {
          availabilities: {
            some: {
              date: { gte: today },
              status: "leave"
            }
          }
        }
      }
    });

    res.json({ active, onLeave });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
};

