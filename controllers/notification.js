const prisma = require("../config/prisma");

exports.list = async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: "desc" },
            take: 20
        });
        res.json(notifications);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.markRead = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.notification.update({
            where: { id: parseInt(id) },
            data: { isRead: true }
        });
        res.json({ message: "Marked as read" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.notification.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: "Deleted" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
}
