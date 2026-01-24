const prisma = require("../config/prisma");
// Get completed tickets for history
exports.getHistory = async (req, res) => {
    try {
        const history = await prisma.ticket.findMany({
            where: {
                assignedToId: req.user.id,
                status: "Fixed"
            },
            include: {
                room: true,
                equipment: true,
                category: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phoneNumber: true,
                        picture: true,
                    },
                },
                logs: {
                    orderBy: { createdAt: "desc" },
                    take: 1
                }
            },
            orderBy: { updatedAt: "desc" },
        });

        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};
