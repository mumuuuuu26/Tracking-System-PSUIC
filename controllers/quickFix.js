const prisma = require("../config/prisma");

exports.list = async (req, res) => {
    try {
        const data = await prisma.quickFix.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                views: 'desc'
            }
        });
        res.send(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.create = async (req, res) => {
    try {
        const { title, description, image, category } = req.body;
        const newFix = await prisma.quickFix.create({
            data: {
                title,
                description,
                image,
                category,
                createdBy: req.user.username,
            },
        });
        res.send(newFix);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, image, category } = req.body;

        const updated = await prisma.quickFix.update({
            where: { id: Number(id) },
            data: {
                title,
                description,
                image,
                category,
            },
        });
        res.send(updated);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await prisma.quickFix.delete({
            where: { id: Number(id) }
        });
        res.send(deleted);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.read = async (req, res) => {
    try {
        const { id } = req.params;
        // Increment view count
        await prisma.quickFix.update({
            where: { id: Number(id) },
            data: { views: { increment: 1 } }
        });

        const data = await prisma.quickFix.findUnique({
            where: { id: Number(id) }
        });
        res.send(data);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
}
