// prisma/seed-it.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding IT Support users...");

  // สร้าง IT Support users
  const itUsers = [
    {
      email: "it1@psu.ac.th",
      password: await bcrypt.hash("password123", 10),
      name: "จิรายุ ทองคำ",
      role: "it_support",
      department: "Hardware Support",
      phoneNumber: "081-234-5678",
      lineId: "it_jirayut",
      username: "it001"
    },
    {
      email: "it2@psu.ac.th",
      password: await bcrypt.hash("password123", 10),
      name: "สมชาย ใจดี",
      role: "it_support",
      department: "Software Support",
      phoneNumber: "082-345-6789",
      lineId: "it_somchai",
      username: "it002"
    }
  ];

  for (const userData of itUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    console.log(`Created IT Support: ${user.name} (${user.email})`);
  }

  // สร้าง Admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@psu.ac.th" },
    update: {},
    create: {
      email: "admin@psu.ac.th",
      password: await bcrypt.hash("admin123", 10),
      name: "System Admin",
      role: "admin",
      username: "admin001"
    }
  });
  console.log(`Created Admin: ${admin.name}`);

  // สร้าง Test User
  const testUser = await prisma.user.upsert({
    where: { email: "test@psu.ac.th" },
    update: {},
    create: {
      email: "test@psu.ac.th",
      password: await bcrypt.hash("test123", 10),
      name: "Test User",
      role: "user",
      username: "6610110000"
    }
  });
  console.log(`Created Test User: ${testUser.name}`);

  // สร้าง Sample Tickets
  const tickets = [
    {
      title: "Projector ไม่ทำงาน",
      description: "เปิดเครื่องไม่ติด ไฟไม่เข้า",
      urgency: "High",
      status: "not_start",
      createdById: testUser.id,
      roomId: 3, // Room 201
      categoryId: 1, // Classroom Equipment
    },
    {
      title: "คอมพิวเตอร์ค้าง",
      description: "เปิดโปรแกรมไม่ได้ หน้าจอค้าง",
      urgency: "Medium",
      status: "not_start",
      createdById: testUser.id,
      roomId: 6, // Computer Lab
      categoryId: 2, // Computer Lab
    }
  ];

  for (const ticketData of tickets) {
    const ticket = await prisma.ticket.create({
      data: ticketData
    });
    console.log(`Created ticket: ${ticket.title}`);
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
