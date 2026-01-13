const prisma = require("../config/prisma");

// List all templates
exports.list = async (req, res) => {
    try {
        const templates = await prisma.emailTemplate.findMany({
            orderBy: { id: 'asc' }
        });
        res.json(templates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Update a template
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, body, isEnabled } = req.body;

        const updated = await prisma.emailTemplate.update({
            where: { id: parseInt(id) },
            data: {
                subject,
                body,
                isEnabled
            }
        });

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};
