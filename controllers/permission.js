const prisma = require("../config/prisma");

// Get permissions for a role (create default if not exists)
exports.getPermissions = async (req, res) => {
    try {
        const { role } = req.params;

        // Ensure role exists in DB or return defaults
        let permission = await prisma.rolePermission.findUnique({
            where: { role: role }
        });

        if (!permission) {
            // Default settings based on role
            const defaults = {
                role: role,
                viewTickets: true,
                editTickets: role === 'admin' || role === 'it_support',
                assignIT: role === 'admin',
                manageUsers: role === 'admin',
                manageEquipment: role === 'admin'
            };
            
            // Auto-create defaults
            permission = await prisma.rolePermission.create({
                data: defaults
            });
        }

        res.json(permission);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Update permissions
exports.updatePermissions = async (req, res) => {
    try {
        const { role } = req.params;
        const data = req.body;

        const permission = await prisma.rolePermission.upsert({
            where: { role: role },
            update: {
                viewTickets: data.viewTickets,
                editTickets: data.editTickets,
                assignIT: data.assignIT,
                manageUsers: data.manageUsers,
                manageEquipment: data.manageEquipment
            },
            create: {
                role: role,
                ...data
            }
        });

        res.json(permission);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Reset to default
exports.resetPermissions = async (req, res) => {
    try {
        const { role } = req.params;
        
        // Define defaults again
        const defaults = {
            viewTickets: true,
            editTickets: role === 'admin' || role === 'it_support',
            assignIT: role === 'admin',
            manageUsers: role === 'admin',
            manageEquipment: role === 'admin'
        };

        const permission = await prisma.rolePermission.upsert({
            where: { role: role },
            update: defaults,
            create: { role: role, ...defaults }
        });

        res.json(permission);
    } catch (err) {
         console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
}
