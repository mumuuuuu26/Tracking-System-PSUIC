const prisma = require("../config/prisma");

// 1. Overview / Monthly Stats
exports.getMonthlyStats = async (req, res) => {
    try {
        const { month, year } = req.query; // e.g., month=9 (October, 0-indexed? No, usually 1-12 from user), year=2024

        // JS Date month is 0-11
        const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
        const targetYear = year ? parseInt(year) : new Date().getFullYear();

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

        // Get all tickets in this range
        const tickets = await prisma.ticket.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                id: true,
                status: true,
                createdAt: true,
                urgency: true,
                // Logic check: Schema has 'urgency'.
            }
        });

        // Group by Day
        const statsByDay = {};
        const daysInMonth = endDate.getDate();

        // Initialize
        for (let i = 1; i <= daysInMonth; i++) {
            statsByDay[i] = { day: i, total: 0, fixed: 0, pending: 0 };
        }

        tickets.forEach(ticket => {
            const day = new Date(ticket.createdAt).getDate();
            if (statsByDay[day]) {
                statsByDay[day].total++;
                if (ticket.status === 'fixed') statsByDay[day].fixed++;
                else statsByDay[day].pending++;
            }
        });

        res.json({
            period: `${targetMonth + 1}/${targetYear}`,
            total: tickets.length,
            solved: tickets.filter(t => t.status === 'fixed').length,
            pending: tickets.filter(t => t.status !== 'fixed').length,
            data: Object.values(statsByDay)
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// 2. Annual Stats
exports.getAnnualStats = async (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();

        const startDate = new Date(targetYear, 0, 1);
        const endDate = new Date(targetYear, 11, 31, 23, 59, 59);

        const tickets = await prisma.ticket.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });

        const statsByMonth = [];
        for (let i = 0; i < 12; i++) {
            statsByMonth.push({
                name: new Date(targetYear, i).toLocaleString('en-US', { month: 'short' }),
                month: i + 1,
                total: 0,
                fixed: 0,
                pending: 0
            });
        }

        tickets.forEach(ticket => {
            const m = new Date(ticket.createdAt).getMonth();
            statsByMonth[m].total++;
            if (ticket.status === 'fixed') statsByMonth[m].fixed++;
            else statsByMonth[m].pending++;
        });

        res.json(statsByMonth);

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// 3. Equipment Analysis
exports.getEquipmentStats = async (req, res) => {
    try {
        // Top 10 problematic equipment
        // Group by equipmentId
        const result = await prisma.ticket.groupBy({
            by: ['equipmentId'],
            where: { equipmentId: { not: null } },
            _count: {
                _all: true
            },
            orderBy: {
                _count: {
                    equipmentId: 'desc'
                }
            },
            take: 10
        });

        // Enrich with equipment details (Prisma groupBy doesn't allow include)
        const enriched = await Promise.all(result.map(async (item) => {
            const eq = await prisma.equipment.findUnique({
                where: { id: item.equipmentId },
                include: { room: true }
            });
            return {
                amount: item._count._all,
                name: eq ? eq.name : 'Unknown',
                room: eq && eq.room ? eq.room.roomNumber : '-',
                status: eq ? eq.status : '-'
            };
        }));

        res.json(enriched);

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// 4. IT Performance
exports.getITPerformance = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { role: 'it_support' },
            select: {
                id: true,
                name: true,
                email: true,
                totalResolved: true,
                totalRated: true,
                avgRating: true,
                picture: true
            },
            orderBy: {
                totalResolved: 'desc'
            }
        });

        // Optionally calculate current pending jobs for each
        const result = await Promise.all(users.map(async (u) => {
            const pending = await prisma.ticket.count({
                where: {
                    assignedToId: u.id,
                    status: { not: 'fixed' }
                }
            });

            // Calculate SLA Averages
            const closedTickets = await prisma.ticket.findMany({
                where: { assignedToId: u.id, status: 'fixed' },
                select: { responseTime: true, resolutionTime: true }
            });

            let totalResponse = 0, totalResolution = 0, countResponse = 0, countResolution = 0;

            closedTickets.forEach(t => {
                if (t.responseTime) { totalResponse += t.responseTime; countResponse++; }
                if (t.resolutionTime) { totalResolution += t.resolutionTime; countResolution++; }
            });

            return {
                ...u,
                pendingJobs: pending,
                avgResponseTime: countResponse > 0 ? (totalResponse / countResponse).toFixed(0) : 0,
                avgResolutionTime: countResolution > 0 ? (totalResolution / countResolution).toFixed(0) : 0
            };
        }));

        res.json(result);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};
// 5. Satisfaction Stats
exports.getSatisfactionStats = async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            where: { rating: { not: null } },
            select: {
                id: true,
                rating: true,
                userFeedback: true,
                createdAt: true,
                assignedTo: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        const totalRated = tickets.length;
        const averageRating = totalRated > 0
            ? tickets.reduce((acc, t) => acc + t.rating, 0) / totalRated
            : 0;

        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        tickets.forEach(t => {
            if (distribution[t.rating] !== undefined) distribution[t.rating]++;
        });

        res.json({
            averageRating,
            totalRated,
            distribution,
            recentFeedback: tickets.slice(0, 10) // Last 10 feedbacks
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};
