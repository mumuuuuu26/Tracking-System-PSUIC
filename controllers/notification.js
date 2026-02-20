const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");

exports.list = async (req, res, next) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: "desc" },
            take: 20
        });
        res.json(notifications);
    } catch (err) {
        next(err);
    }
};

exports.markRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        // [SECURITY FIX] Scope to current user to prevent ID-guessing attacks
        const notification = await prisma.notification.findFirst({
            where: { id: parseInt(id), userId: req.user.id }
        });
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        await prisma.notification.update({
            where: { id: parseInt(id) },
            data: { read: true, readAt: new Date() }
        });
        res.json({ message: "Marked as read" });
    } catch (err) {
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const { id } = req.params;
        // [SECURITY FIX] Scope to current user to prevent ID-guessing attacks
        const notification = await prisma.notification.findFirst({
            where: { id: parseInt(id), userId: req.user.id }
        });
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        await prisma.notification.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: "Deleted" });
    } catch (err) {
        next(err);
    }
};
