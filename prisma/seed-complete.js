const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
    // Clear existing data
    await prisma.notification.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.image.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.equipment.deleteMany();
    await prisma.room.deleteMany();
    await prisma.category.deleteMany();
    await prisma.iTAvailability.deleteMany();
    await prisma.user.deleteMany();

    console.log("Seeding complete database...");

    // 1. Create Categories
    const categories = await Promise.all([
        "Hardware", "Software", "Network", "Printer", "Account", "Other"
    ].map(name =>
        prisma.category.create({ data: { name } })
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
            status: "pending",
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
