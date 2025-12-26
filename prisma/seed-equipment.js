// prisma/seed-equipment.js
const { PrismaClient } = require("@prisma/client");
const QRCode = require("qrcode");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Rooms and Equipment...");

  // สร้างห้องตัวอย่าง
  const rooms = [
    { roomNumber: "PSUIC 1211", building: "IC Building", floor: 2 },
    { roomNumber: "PSUIC 1212", building: "IC Building", floor: 2 },
    { roomNumber: "PSUIC Lab 1", building: "IC Building", floor: 1 },
  ];

  for (const roomData of rooms) {
    const room = await prisma.room.upsert({
      where: { roomNumber: roomData.roomNumber },
      update: {},
      create: roomData,
    });

    console.log(`Created room: ${room.roomNumber}`);

    // สร้างอุปกรณ์ในแต่ละห้อง
    if (room.roomNumber === "PSUIC 1211") {
      for (let i = 1; i <= 10; i++) {
        const equipmentName = `Computer PC-${String(i).padStart(2, "0")}`;
        const qrCode = `EQUIPMENT_${room.roomNumber}_PC${i}_${Date.now()}`;

        await prisma.equipment.create({
          data: {
            name: equipmentName,
            type: "Computer",
            serialNo: `SN-PC-1211-${String(i).padStart(2, "0")}`,
            qrCode: qrCode,
            roomId: room.id,
          },
        });

        console.log(`Created equipment: ${equipmentName} with QR: ${qrCode}`);
      }

      // เพิ่มอุปกรณ์อื่นๆ
      await prisma.equipment.create({
        data: {
          name: "Projector EPSON-01",
          type: "Projector",
          serialNo: "SN-PROJ-1211-01",
          qrCode: `EQUIPMENT_${room.roomNumber}_PROJ01_${Date.now()}`,
          roomId: room.id,
        },
      });
    }
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
