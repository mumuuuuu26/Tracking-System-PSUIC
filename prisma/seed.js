// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding for PSUIC System...");

  //สร้างหมวดหมู่ (Category) ---
  const categories = [
    { name: "Classroom Equipment" },
    { name: "Computer Lab" },
    { name: "Software & License" },
    { name: "Network & WiFi" },
    { name: "Account / PSU Passport" },
    { name: "Facility" },
  ];

  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    console.log(`Created category: ${category.name} (ID: ${category.id})`);
  }

  //สร้างห้อง (Room) --- [ส่วนที่เพิ่มใหม่]
  const rooms = [
    // Floor 1
    { roomNumber: "101", floor: 1, building: "PSUIC Building" },
    { roomNumber: "102", floor: 1, building: "PSUIC Building" },
    // Floor 2
    { roomNumber: "201", floor: 2, building: "PSUIC Building" },
    { roomNumber: "202", floor: 2, building: "PSUIC Building" },
    // Floor 3
    { roomNumber: "301", floor: 3, building: "PSUIC Building" },
    { roomNumber: "Computer Lab", floor: 3, building: "PSUIC Building" },
    // Floor 4
    { roomNumber: "401", floor: 4, building: "PSUIC Building" },
    { roomNumber: "Conference Room", floor: 4, building: "PSUIC Building" },
  ];

  for (const r of rooms) {
    const room = await prisma.room.upsert({
      where: { roomNumber: r.roomNumber }, // เช็คจากเลขห้อง ถ้ามีแล้วจะไม่สร้างซ้ำ
      update: {},
      create: r,
    });
    console.log(
      `Created room: ${room.roomNumber} on Floor ${room.floor} (ID: ${room.id})`
    );
  }

  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
