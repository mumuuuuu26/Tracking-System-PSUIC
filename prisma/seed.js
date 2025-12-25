const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding for PSUIC System...");

  //หมวดหมู่
  const categories = [
    { name: "Classroom Equipment" }, //ID1 (โปรเจกเตอร์, ไมค์)
    { name: "Computer Lab" }, // ID2 (PC, จอคอมฯ)
    { name: "Software & License" }, //ID3 (Adobe, Office)
    { name: "Network & WiFi" }, // ID4 (เน็ตหลุด, ต่อไม่ได้)
    { name: "Account / PSU Passport" }, //ID5 (Login ไม่ได้)
    { name: "Facility" }, // ID6 (ปลั๊กพัง, แอร์เสีย)
  ];

  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    console.log(`Created category: ${category.name} with ID: ${category.id}`);
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
