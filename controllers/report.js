const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");


// 1. Overview / Monthly Stats
exports.getMonthlyStats = async (req, res, next) => {
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
                status: {
                    not: 'rejected'
                },
                isDeleted: false // [FIX] exclude soft-deleted tickets from monthly stats
            },
            select: {
                id: true,
                status: true,
                createdAt: true,
            }
        });

        // Group by Day
        const statsByDay = {};
        const daysInMonth = endDate.getDate();

        // Initialize
        for (let i = 1; i <= daysInMonth; i++) {
            statsByDay[i] = { day: i, total: 0, not_started: 0, in_progress: 0, completed: 0 };
        }

        tickets.forEach(ticket => {
            const day = new Date(ticket.createdAt).getDate();
            if (statsByDay[day]) {
                statsByDay[day].total++;
                if (ticket.status === 'completed') statsByDay[day].completed++;
                else if (ticket.status === 'in_progress') statsByDay[day].in_progress++;
                else statsByDay[day].not_started++; // 'not_start' or others
            }
        });

        // Calculate Summary Stats
        const total = tickets.length;
        const completed = tickets.filter(t => t.status === 'completed').length;
        const in_progress = tickets.filter(t => t.status === 'in_progress').length;
        const not_started = tickets.filter(t => t.status !== 'completed' && t.status !== 'in_progress').length;
        
        // Resolution Rate
        const resolutionRate = total > 0 ? ((completed / total) * 100).toFixed(0) : 0;

        res.json({
            period: `${targetMonth + 1}/${targetYear}`,
            total,
            not_started,
            in_progress,
            completed,
            resolutionRate,
            data: Object.values(statsByDay)
        });

    } catch (err) {
        next(err);
    }
};

// 2. Annual Stats
exports.getAnnualStats = async (req, res, next) => {
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
                },
                status: {
                    not: 'rejected'
                },
                isDeleted: false // [FIX] exclude soft-deleted tickets from annual stats
            }
        });

        const statsByMonth = [];
        for (let i = 0; i < 12; i++) {
            statsByMonth.push({
                name: new Date(targetYear, i).toLocaleString('en-US', { month: 'short' }),
                month: i + 1,
                total: 0,
                completed: 0,
                pending: 0
            });
        }

        tickets.forEach(ticket => {
            const m = new Date(ticket.createdAt).getMonth();
            statsByMonth[m].total++;
            if (ticket.status === 'completed') statsByMonth[m].completed++;
            else statsByMonth[m].pending++;
        });

        res.json(statsByMonth);

    } catch (err) {
        next(err);
    }
};

// 3. Equipment Analysis
exports.getEquipmentStats = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        let whereTicket = { 
            equipmentId: { not: null },
            isDeleted: false,
            status: { not: 'rejected' }
        };

        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            whereTicket.createdAt = { gte: startDate, lte: endDate };
        }

        // Top 10 problematic equipment
        const result = await prisma.ticket.groupBy({
            by: ['equipmentId'],
            where: whereTicket,
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
        next(err);
    }
};

// 4. IT Performance
// 4. IT Performance (Personal KPI)
exports.getITPerformance = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        // Date Filter Logic
        const dateFilter = startDate && endDate ? {
            updatedAt: {
                gte: new Date(startDate),
                lte: new Date(new Date(endDate).setHours(23, 59, 59))
            }
        } : {};

        const users = await prisma.user.findMany({
            where: { role: 'it_support' },
            select: {
                id: true,
                name: true,
                email: true,
                picture: true,
                role: true
            }
        });

        const result = await Promise.all(users.map(async (u) => {
            // 1. Current Active Jobs (Snapshot - No Date Filter)
            const pending = await prisma.ticket.count({
                where: {
                    assignedToId: u.id,
                    status: { notIn: ['completed', 'rejected'] },
                    isDeleted: false
                }
            });

            // 2. Tickets Resolved in Range
            const resolvedInRange = await prisma.ticket.count({
                where: {
                    assignedToId: u.id,
                    status: 'completed',
                    isDeleted: false,
                    ...dateFilter
                }
            });

            // 3. SLA Calculation (based on resolved tickets in range)
            const closedTickets = await prisma.ticket.findMany({
                where: { 
                    assignedToId: u.id, 
                    status: 'completed',
                    isDeleted: false,
                    ...dateFilter
                },
                select: { responseTime: true, resolutionTime: true }
            });

            let totalResponse = 0, totalResolution = 0, countResponse = 0, countResolution = 0;

            closedTickets.forEach(t => {
                if (t.responseTime !== null) { totalResponse += t.responseTime; countResponse++; }
                if (t.resolutionTime !== null) { totalResolution += t.resolutionTime; countResolution++; }
            });

            return {
                ...u,
                pendingJobs: pending,
                totalResolved: resolvedInRange, // Overwrite cumulative with period specific
                avgResponseTime: countResponse > 0 ? (totalResponse / countResponse).toFixed(0) : 0,
                avgResolutionTime: countResolution > 0 ? (totalResolution / countResolution).toFixed(0) : 0
            };
        }));

        res.json(result);
    } catch (err) {
        next(err);
    }
};


// 6. Floor & Room Analysis
exports.getRoomStats = async (req, res, next) => {
    try {
        const { month, year } = req.query;
        let baseWhere = { 
            isDeleted: false,
            status: { not: 'rejected' }
        };

        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            baseWhere.createdAt = { gte: startDate, lte: endDate };
        }

        // Get ticket distribution by room
        const ticketsByRoom = await prisma.ticket.groupBy({
            by: ['roomId'],
            where: baseWhere,
            _count: {
                _all: true
            },
            orderBy: {
                _count: {
                    roomId: 'desc'
                }
            }
        });

        // Enrich with room details and status breakdown
        const enriched = await Promise.all(ticketsByRoom.map(async (item) => {
            const room = await prisma.room.findUnique({
                where: { id: item.roomId },
                select: { roomNumber: true, floor: true }
            });

            const statusCounts = await prisma.ticket.groupBy({
                by: ['status'],
                where: { 
                    ...baseWhere,
                    roomId: item.roomId
                },
                _count: { _all: true }
            });

            const breakdown = {
                completed: statusCounts.find(s => s.status === 'completed')?._count._all || 0,
                pending: statusCounts.filter(s => s.status !== 'completed' && s.status !== 'rejected').reduce((acc, s) => acc + s._count._all, 0)
            };

            return {
                roomId: item.roomId,
                roomNumber: room?.roomNumber || 'Unknown',
                floor: room?.floor || 'Unspecified',
                totalTickets: item._count._all,
                ...breakdown
            };
        }));

        res.json(enriched);
    } catch (err) {
        next(err);
    }
};
