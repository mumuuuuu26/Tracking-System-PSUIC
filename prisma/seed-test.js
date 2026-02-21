const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log('--- Start Seeding Test Data ---');

  // 1. สร้าง Users (Password: 123456)
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('123456', salt);

  const admin = await prisma.user.upsert({
    where: { email: 'test_admin@psu.ac.th' },
    update: {},
    create: {
      email: 'test_admin@psu.ac.th',
      username: 'test_admin',
      password,
      role: 'admin',
      name: 'Test Administrator',
    },
  });

  const itSupport = await prisma.user.upsert({
    where: { email: 'test_it@psu.ac.th' },
    update: {},
    create: {
      email: 'test_it@psu.ac.th',
      username: 'test_it',
      password,
      role: 'it_support',
      name: 'Test IT Support',
      department: 'Software',
    },
  });

  // 2. สร้าง Room, Category & Equipment สำหรับทดสอบ QR Code (Sub-component Strategy)
  const room = await prisma.room.upsert({
    where: { roomNumber: '1201' },
    update: {},
    create: {
      roomNumber: '1201',
      building: 'Learning Center',
      floor: 12,
    },
  });

  // สร้าง Category "Computer" พร้อม Sub-components
  const computerCategory = await prisma.category.upsert({
    where: { name: 'Computer' },
    update: {},
    create: {
      name: 'Computer',
      subComponents: {
        create: [
          { name: 'หน้าจอคอม' },
          { name: 'เมาส์' },
          { name: 'คีย์บอร์ด' },
          { name: 'เคส (CPU)' },
          { name: 'UPS' }
        ]
      }
    }
  });

  // สร้าง Equipment "Workstation-01" ถึง "Workstation-35"
  const workstations = [];
  for (let i = 1; i <= 35; i++) {
    const paddedNum = String(i).padStart(2, '0');
    const wsName = `Workstation-${paddedNum}`;
    const ws = await prisma.equipment.upsert({
      where: { serialNo: `SN-WS-${paddedNum}` },
      update: {},
      create: {
        name: wsName,
        type: 'Computer', // แมพกับ Category Name
        serialNo: `SN-WS-${paddedNum}`,
        qrCode: `QR-WS-${paddedNum}`,
        status: 'Normal',
        roomId: room.id,
      },
    });
    workstations.push(ws);
  }

  // ใช้ Workstation-01 เป็นตัวแทนในการสร้างตั๋วทดสอบ
  const equipment = workstations[0];

  // 3. สร้างตั๋วจำลองในสถานะต่างๆ เพื่อเช็ค Dashboard และ SLA
  // ตั๋วใหม่ (ยังไม่มีคนรับ)
  await prisma.ticket.create({
    data: {
      title: 'Test New Ticket',
      description: 'System testing for new notifications',
      urgency: 'High',
      status: 'not_start',
      createdById: admin.id,
      roomId: room.id,
    },
  });

  // ตั๋วที่เสร็จแล้ว (เพื่อทดสอบการคำนวณ SLA)
  const completedAt = new Date();
  const acceptedAt = new Date(completedAt.getTime() - (60 * 60 * 1000)); // รับงานก่อนเสร็จ 1 ชม.
  const createdAt = new Date(acceptedAt.getTime() - (30 * 60 * 1000)); // สร้างก่อนรับ 30 นาที

  await prisma.ticket.create({
    data: {
      title: 'SLA Test Ticket',
      description: 'Testing resolution time calculation',
      status: 'completed',
      urgency: 'Medium',
      createdById: admin.id,
      assignedToId: itSupport.id,
      roomId: room.id,
      equipmentId: equipment.id,
      categoryId: computerCategory.id,
      subComponent: 'หน้าจอคอม',
      createdAt,
      acceptedAt,
      completedAt,
      responseTime: 30, // นาที
      resolutionTime: 60, // นาที
    },
  });

  console.log('--- Test Data Seeded Successfully ---');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
