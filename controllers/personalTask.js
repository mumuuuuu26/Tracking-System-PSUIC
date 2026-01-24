const prisma = require("../config/prisma");

exports.createTask = async (req, res) => {
    try {
        const { title, description, date, startTime, endTime, color } = req.body;
        const userId = req.user.id; // From authMiddleware

        const newTask = await prisma.personalTask.create({
            data: {
                userId,
                title,
                description,
                date: new Date(date),
                startTime: startTime ? new Date(startTime) : null,
                endTime: endTime ? new Date(endTime) : null,
                color,
            },
        });

        res.json(newTask);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const { start, end } = req.query; // Optional date range

        let whereClause = { userId };

        if (start && end) {
            whereClause.date = {
                gte: new Date(start),
                lte: new Date(end),
            };
        } else if (req.query.date) {
            whereClause.date = new Date(req.query.date);
        }

        const tasks = await prisma.personalTask.findMany({
            where: whereClause,
            orderBy: {
                startTime: 'asc',
            },
        });

        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, date, startTime, endTime, color, isCompleted } = req.body;
        const userId = req.user.id;

        // Check ownership
        const task = await prisma.personalTask.findUnique({ where: { id: parseInt(id) } });
        if (!task || task.userId !== userId) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const updated = await prisma.personalTask.update({
            where: { id: parseInt(id) },
            data: {
                title,
                description,
                date: date ? new Date(date) : undefined,
                startTime: startTime ? new Date(startTime) : undefined,
                endTime: endTime ? new Date(endTime) : undefined,
                color,
                isCompleted
            },
        });

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const task = await prisma.personalTask.findUnique({ where: { id: parseInt(id) } });
        if (!task || task.userId !== userId) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await prisma.personalTask.delete({
            where: { id: parseInt(id) },
        });

        res.json({ message: "Task deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};
