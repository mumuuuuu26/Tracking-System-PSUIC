const prisma = require("../config/prisma");

// List all KB items (with filters)
exports.listKB = async (req, res) => {
    try {
        const { category, search, tag } = req.query;

        let where = { isPublished: true };

        if (category && category !== "All") {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { title: { contains: search } }, // Case insensitive usually depends on DB collation
                { content: { contains: search } },
                { tags: { contains: search } }
            ];
        }

        if (tag) {
            where.tags = { contains: tag };
        }

        const items = await prisma.knowledgeBase.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                updatedBy: {
                    select: { name: true, role: true }
                }
            }
        });

        res.json(items);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get single KB item
exports.readKB = async (req, res) => {
    try {
        const { id } = req.params;

        // Increment view count
        const item = await prisma.knowledgeBase.update({
            where: { id: parseInt(id) },
            data: {
                viewCount: { increment: 1 }
            },
            include: {
                updatedBy: {
                    select: { name: true, role: true }
                }
            }
        });

        res.json(item);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Create KB item (IT/Admin)
exports.createKB = async (req, res) => {
    try {
        const { title, content, category, tags, imageUrl, videoUrl } = req.body;

        const newItem = await prisma.knowledgeBase.create({
            data: {
                title,
                content,
                category,
                tags,
                imageUrl,
                videoUrl,
                updatedById: req.user.id
            }
        });

        res.json(newItem);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Update KB item
exports.updateKB = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updated = await prisma.knowledgeBase.update({
            where: { id: parseInt(id) },
            data: {
                ...data,
                updatedById: req.user.id
            }
        });

        res.json(updated);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Remove KB item
exports.removeKB = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.knowledgeBase.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Vote helpful
exports.voteHelpful = async (req, res) => {
    try {
        const { id } = req.params;

        const updated = await prisma.knowledgeBase.update({
            where: { id: parseInt(id) },
            data: {
                helpful: { increment: 1 }
            }
        });

        res.json(updated);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};
