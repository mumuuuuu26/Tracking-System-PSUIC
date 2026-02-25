const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
    // Clear existing data
    await prisma.notification.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.image.deleteMany();
    // await prisma.appointment.deleteMany(); // Removed from schema
    await prisma.ticket.deleteMany();
    await prisma.equipment.deleteMany();
    await prisma.room.deleteMany();
    await prisma.category.deleteMany();
    // await prisma.iTAvailability.deleteMany(); // Removed from schema
    await prisma.user.deleteMany();

    console.log("Seeding complete database...");

    // 1. Create Role Permissions (NEW)
    const roles = ["admin", "it_support", "user"];
    await Promise.all(roles.map(role => 
        prisma.rolePermission.upsert({
            where: { role },
            update: {},
            create: {
                role,
                viewTickets: true,
                editTickets: role !== 'user',
                assignIT: role === 'admin',
                manageUsers: role === 'admin',
                manageEquipment: role !== 'user'
            }
        })
    ));

    // 2. Create Email Templates (NEW)
    await prisma.emailTemplate.upsert({
        where: { name: 'new_ticket_it' },
        update: {},
        create: {
            name: 'new_ticket_it',
            subject: 'New Ticket #{{ticketId}}: {{title}}',
            body: 'A new ticket has been submitted by {{reporterName}}. Urgency: {{urgency}}. Room: {{room}}. <br><a href="{{link}}">Open Ticket</a>',
            variables: JSON.stringify(['ticketId', 'title', 'reporterName', 'urgency', 'room', 'link']),
            isEnabled: true
        }
    });

    // 3. Create Categories
    const categories = await Promise.all([
        "Hardware", "Software", "Network", "Printer", "Account", "Other"
    ].map(name =>
        prisma.category.upsert({ 
            where: { name },
            update: {},
            create: { name } 
        })
    ));

    // 2. Create Rooms
    const rooms = await Promise.all([
        { roomNumber: "LAB-301", building: "PSUIC", floor: 3, capacity: 40, type: "Computer Lab" },
        { roomNumber: "ROOM-201", building: "PSUIC", floor: 2, capacity: 30, type: "Classroom" },
        { roomNumber: "ROOM-401", building: "PSUIC", floor: 4, capacity: 50, type: "Conference" },
    ].map(data =>
        prisma.room.create({ data })
    ));

    // 3. Create Users
    const adminUser = await prisma.user.create({
        data: {
            email: "admin@psu.ac.th",
            password: await bcrypt.hash("admin123", 10),
            name: "System Administrator",
            role: "admin",
            username: "admin001",
            department: "IT Department"
        }
    });

    const itUsers = await Promise.all([
        {
            email: "it1@psu.ac.th",
            password: await bcrypt.hash("it123", 10),
            name: "Somchai IT",
            role: "it_support",
            department: "Hardware Support",
            phoneNumber: "081-234-5678"
        },
        {
            email: "it2@psu.ac.th",
            password: await bcrypt.hash("it123", 10),
            name: "Somsri IT",
            role: "it_support",
            department: "Software Support",
            phoneNumber: "082-345-6789"
        }
    ].map(data => prisma.user.create({ data })));

    const normalUser = await prisma.user.create({
        data: {
            email: "user@psu.ac.th",
            password: await bcrypt.hash("user123", 10),
            name: "Test Student",
            role: "user",
            username: "6610110001"
        }
    });

    // 4. Create Equipment
    const equipments = await Promise.all(
        rooms.flatMap((room, idx) =>
            Array.from({ length: 3 }, (_, i) => ({
                name: `Computer-${room.roomNumber}-${i + 1}`,
                type: "Computer",
                serialNo: `SN-${Date.now()}-${idx}-${i}`,
                qrCode: `QR-${room.id}-${i}`,
                roomId: room.id
            }))
        ).map(data => prisma.equipment.create({ data }))
    );

    // 5. Create Sample Tickets
    const tickets = await Promise.all([
        {
            title: "Computer won't start",
            description: "The computer in Lab 301 won't turn on",
            urgency: "High",
            status: "not_start",
            createdById: normalUser.id,
            roomId: rooms[0].id,
            equipmentId: equipments[0].id,
            categoryId: categories[0].id
        },
        {
            title: "Printer jam",
            description: "Paper stuck in printer",
            urgency: "Medium",
            status: "in_progress",
            createdById: normalUser.id,
            assignedToId: itUsers[0].id,
            roomId: rooms[1].id,
            categoryId: categories[3].id
        }
    ].map(data => prisma.ticket.create({ data })));

    // 6. Create Quick Fixes (NEW)
    await prisma.quickFix.create({
        data: {
            title: "Cannot Connect to Wi-Fi",
            description: "1. Click Wi-Fi icon.\n2. Select PSU-WiFi.\n3. Login with PSU Passport.",
            category: "Network",
            createdBy: "admin"
        }
    });

    console.log("✅ Database seeded successfully!");
    console.log("Login credentials:");
    console.log("Admin: admin@psu.ac.th / admin123");
    console.log("IT: it1@psu.ac.th / it123");
    console.log("User: user@psu.ac.th / user123");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
