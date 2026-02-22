require('../config/env');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
    const dbUrl = process.env.DATABASE_URL || '';

    if (!dbUrl.includes('_test')) {
      console.error('\n🚨 SAFETY STOP');
      console.error('Seed is allowed ONLY on TEST database');
      console.error('Current DB:', dbUrl);
      process.exit(1);
    }

    if (process.env.NODE_ENV !== 'test') {
      console.error('\n🚨 SAFETY STOP');
      console.error('NODE_ENV must be test to run seed');
      process.exit(1);
    }

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

            // 2. Create Users
            console.log('👤 Creating test users...');
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
            const admin = await tx.user.create({
                data: {
                    email: 'e2e.admin@test.com',
                    password: passwordHash,
                    name: 'E2E Admin',
                    role: 'admin',
                    enabled: true
                }
            });
            const itSupport = await tx.user.create({
                data: {
                    email: 'e2e.it@test.com',
                    password: passwordHash,
                    name: 'E2E IT',
                    role: 'it_support',
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
            const ticketOpen = await tx.ticket.create({
                data: {
                    title: 'Wifi ใช้ไม่ได้',
                    description: 'E2E auto generated ticket',
                    status: 'not_start',
                    urgency: 'Medium',
                    categoryId: catNetwork.id,
                    roomId: roomLab1.id,
                    createdById: user.id
                }
            });

            const acceptedAt = new Date(Date.now() - 45 * 60 * 1000);
            await tx.ticket.create({
                data: {
                    title: 'Printer status pending fix',
                    description: 'Assigned in-progress ticket for IT E2E',
                    status: 'in_progress',
                    urgency: 'High',
                    categoryId: createdCategories[2].id,
                    roomId: createdRooms[1].id,
                    createdById: user.id,
                    assignedToId: itSupport.id,
                    acceptedAt,
                    responseTime: 15
                }
            });

            await tx.ticket.create({
                data: {
                    title: 'Projector resolved',
                    description: 'Completed ticket for history/report E2E',
                    status: 'completed',
                    urgency: 'Low',
                    categoryId: createdCategories[1].id,
                    roomId: createdRooms[2].id,
                    createdById: user.id,
                    assignedToId: itSupport.id,
                    acceptedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
                    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    responseTime: 10,
                    resolutionTime: 60,
                    note: 'Seeded completed ticket'
                }
            });

            await tx.notification.createMany({
                data: [
                    {
                        userId: admin.id,
                        ticketId: ticketOpen.id,
                        title: 'New Ticket Created',
                        message: `Ticket #${ticketOpen.id}: ${ticketOpen.title}`,
                        type: 'ticket_create'
                    },
                    {
                        userId: itSupport.id,
                        ticketId: ticketOpen.id,
                        title: 'New Ticket Created',
                        message: `Ticket #${ticketOpen.id}: ${ticketOpen.title}`,
                        type: 'ticket_create'
                    }
                ]
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
