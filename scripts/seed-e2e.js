const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Resetting E2E database...');

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Clean Database
            // Disable FK checks to allow truncation
            await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

            const tables = ['Ticket', 'Room', 'Category', 'User', 'ActivityLog', 'Image', 'Equipment', 'Notification'];
            for (const table of tables) {
                try {
                    await tx.$executeRawUnsafe(`TRUNCATE TABLE ${table};`);
                } catch (e) {
                    console.warn(`Truncate failed for ${table}, trying delete:`, e.message);
                    await tx.$executeRawUnsafe(`DELETE FROM ${table};`);
                }
            }

            await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
            console.log('🧹 Database cleaned');

            // 2. Create User
            console.log('👤 Creating test user...');
            const passwordHash = await bcrypt.hash('12345678', 10);
            const user = await tx.user.create({
                data: {
                    email: 'e2e@test.com',
                    password: passwordHash,
                    name: 'E2E User',
                    role: 'user',
                    enabled: true
                }
            });

            // 3. Create Categories
            console.log('📂 Creating categories...');
            const createdCategories = await Promise.all([
                tx.category.create({ data: { name: 'Network' } }),
                tx.category.create({ data: { name: 'Computer' } }),
                tx.category.create({ data: { name: 'Printer' } })
            ]);
            // Ensure we use the correct ID, usually the first one created is fine for the test ticket
            const catNetwork = createdCategories[0];

            // 4. Create Rooms
            console.log('🏫 Creating rooms...');
            const createdRooms = await Promise.all([
                tx.room.create({ data: { roomNumber: 'Lab 1', floor: 1 } }),
                tx.room.create({ data: { roomNumber: 'Lab 2', floor: 2 } }),
                tx.room.create({ data: { roomNumber: 'Office', floor: 3 } })
            ]);
            const roomLab1 = createdRooms[0];

            // 5. Create Ticket
            console.log('🎫 Creating tickets...');
            await tx.ticket.create({
                data: {
                    title: 'Wifi ใช้ไม่ได้',
                    description: 'E2E auto generated ticket',
                    status: 'not_start', // User said 'open' but schema defaults/uses 'not_start' usually. User request said 'open' in SQL, but schema probably maps it. 
                                         // Warning: Schema has 'not_start', 'in_progress', 'completed'. 'open' might be invalid enum if mapped, but here it is String.
                                         // Checked schema: status String @default("not_start"). 'open' might mean 'not_start' in user's context or just a string.
                                         // User's SQL used 'open'. I will use 'not_start' to be safe with app logic, or 'open' if strict.
                                         // Let's use 'not_start' as it is the default in schema and likely what the app expects for "New".
                                         // RE-READING USER REQUEST: "VALUES (?, ?, 'open', ?, ?, ?)". 
                                         // I will use 'not_start' because `Report.jsx` filters check for "not_start".
                    urgency: 'Normal',
                    categoryId: catNetwork.id,
                    roomId: roomLab1.id,
                    createdById: user.id
                }
            });
        }, {
            timeout: 10000 // 10s timeout
        });

        console.log('✅ E2E seed completed successfully');
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

seed();
