const prisma = require("../config/prisma");

exports.list = async (req, res) => {
    try {
        const quickFixes = await prisma.quickFix.findMany({
            include: { category: true },
            orderBy: { createdAt: "desc" },
        });
        res.json(quickFixes);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.create = async (req, res) => {
    try {
        const { title, steps, categoryId } = req.body;
        const quickFix = await prisma.quickFix.create({
            data: {
                title,
                steps, // Expecting JSON string or text
                categoryId: parseInt(categoryId),
            },
        });
        res.json(quickFix);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, steps, categoryId } = req.body;
        const quickFix = await prisma.quickFix.update({
            where: { id: parseInt(id) },
            data: {
                title,
                steps,
                categoryId: parseInt(categoryId),
            },
        });
        res.json(quickFix);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.quickFix.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: "Quick Fix deleted successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};
