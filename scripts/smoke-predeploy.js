require('../config/env');

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../server');
const prisma = require('../config/prisma');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function createUser({ email, password, role, name }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email,
      password: passwordHash,
      role,
      name,
      enabled: true,
    },
  });
}

async function login(email, password) {
  const res = await request(app).post('/api/login').send({ email, password });
  assert(res.statusCode === 200, `Login failed for ${email}: ${res.statusCode}`);
  assert(res.body?.token, `Missing token for ${email}`);
  return res.body.token;
}

async function cleanup(resources) {
  const userIds = [resources.adminUserId, resources.itUserId, resources.userId].filter(Boolean);
  const ticketIds = [resources.ticketId].filter(Boolean);
  const notificationIds = [resources.notificationId].filter(Boolean);

  try {
    await prisma.notification.deleteMany({
      where: {
        OR: [
          notificationIds.length > 0 ? { id: { in: notificationIds } } : undefined,
          ticketIds.length > 0 ? { ticketId: { in: ticketIds } } : undefined,
          userIds.length > 0 ? { userId: { in: userIds } } : undefined,
        ].filter(Boolean),
      },
    });

    if (ticketIds.length > 0) {
      await prisma.ticket.deleteMany({ where: { id: { in: ticketIds } } });
    }

    if (resources.roomId) {
      await prisma.room.deleteMany({ where: { id: resources.roomId } });
    }

    if (resources.categoryId) {
      await prisma.category.deleteMany({ where: { id: resources.categoryId } });
    }

    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
  } catch (cleanupError) {
    console.error(`[SMOKE] Cleanup warning: ${cleanupError.message}`);
  }
}

async function main() {
  const suffix = `${Date.now()}`;
  const resources = {
    categoryId: null,
    roomId: null,
    userId: null,
    adminUserId: null,
    itUserId: null,
    ticketId: null,
    notificationId: null,
  };

  const emails = {
    user: `smoke_user_${suffix}@example.com`,
    admin: `smoke_admin_${suffix}@example.com`,
    it: `smoke_it_${suffix}@example.com`,
  };

  const passwords = {
    user: 'SmokeUser123!',
    admin: 'SmokeAdmin123!',
    it: 'SmokeIt123!',
  };

  try {
    console.log('[SMOKE] Starting pre-deploy smoke checks...');
    await prisma.$connect();
    await prisma.$queryRawUnsafe('SELECT 1');
    console.log('[SMOKE] Database connectivity: OK');

    const room = await prisma.room.create({
      data: {
        roomNumber: `SMOKE_ROOM_${suffix}`,
        floor: 1,
        building: 'SMOKE',
      },
    });
    resources.roomId = room.id;

    const category = await prisma.category.create({
      data: {
        name: `SMOKE_CATEGORY_${suffix}`,
      },
    });
    resources.categoryId = category.id;

    const user = await createUser({
      email: emails.user,
      password: passwords.user,
      role: 'user',
      name: 'Smoke User',
    });
    resources.userId = user.id;

    const admin = await createUser({
      email: emails.admin,
      password: passwords.admin,
      role: 'admin',
      name: 'Smoke Admin',
    });
    resources.adminUserId = admin.id;

    const itSupport = await createUser({
      email: emails.it,
      password: passwords.it,
      role: 'it_support',
      name: 'Smoke IT',
    });
    resources.itUserId = itSupport.id;

    const [userToken, adminToken] = await Promise.all([
      login(emails.user, passwords.user),
      login(emails.admin, passwords.admin),
    ]);
    console.log('[SMOKE] Authentication: OK');

    const createTicketRes = await request(app)
      .post('/api/ticket')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: `Smoke Ticket ${suffix}`,
        description: 'Pre-deploy smoke test ticket',
        urgency: 'Medium',
        roomId: resources.roomId,
        categoryId: resources.categoryId,
      });

    assert(
      [200, 201].includes(createTicketRes.statusCode),
      `Ticket creation failed: ${createTicketRes.statusCode}`,
    );

    resources.ticketId = createTicketRes.body.id;
    assert(resources.ticketId, 'Ticket ID missing after creation');
    console.log('[SMOKE] Authenticated ticket creation: OK');

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const monthlyReportRes = await request(app)
      .get(`/api/reports/monthly?month=${month}&year=${year}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert(monthlyReportRes.statusCode === 200, `Monthly report failed: ${monthlyReportRes.statusCode}`);
    assert(Array.isArray(monthlyReportRes.body.data), 'Monthly report data is invalid');

    const equipmentReportRes = await request(app)
      .get(`/api/reports/equipment?month=${month}&year=${year}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert(equipmentReportRes.statusCode === 200, `Equipment report failed: ${equipmentReportRes.statusCode}`);
    assert(Array.isArray(equipmentReportRes.body), 'Equipment report payload is invalid');
    console.log('[SMOKE] Report API (export source data): OK');

    const notificationsRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${adminToken}`);

    assert(notificationsRes.statusCode === 200, `Notification list failed: ${notificationsRes.statusCode}`);
    const adminNotifications = Array.isArray(notificationsRes.body) ? notificationsRes.body : [];

    const createdTicketNotification = adminNotifications.find((n) => n.ticketId === resources.ticketId);
    assert(createdTicketNotification, 'Ticket notification for admin was not created');
    resources.notificationId = createdTicketNotification.id;

    const readRes = await request(app)
      .put(`/api/notification/${resources.notificationId}/read`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert(readRes.statusCode === 200, `Mark notification as read failed: ${readRes.statusCode}`);

    const deleteRes = await request(app)
      .delete(`/api/notification/${resources.notificationId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert(deleteRes.statusCode === 200, `Delete notification failed: ${deleteRes.statusCode}`);

    console.log('[SMOKE] Notification flow: OK');
    console.log('[SMOKE] All pre-deploy smoke checks passed.');
  } catch (error) {
    console.error(`[SMOKE] FAILED: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await cleanup(resources);
    await prisma.$disconnect();
    process.exit(process.exitCode || 0);
  }
}

main();
