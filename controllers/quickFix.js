const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");

exports.list = async (req, res, next) => {
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
        next(err);
    }
};

exports.create = async (req, res, next) => {
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
        next(err);
    }
};

exports.update = async (req, res, next) => {
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
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await prisma.quickFix.delete({
            where: { id: Number(id) }
        });
        res.send(deleted);
    } catch (err) {
        next(err);
    }
};

exports.read = async (req, res, next) => {
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
        next(err);
    }
}
