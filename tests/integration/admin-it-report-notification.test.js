const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../../server");
const prisma = require("../../config/prisma");

describe("Admin/IT/Report/Notification Integration", () => {
  const suffix = Date.now();
  const state = {
    tokens: {},
    users: {},
    roomId: null,
    categoryId: null,
    ticketForIT: null,
    ticketForReport: null,
    noteUserAId: null,
    noteUserBId: null,
    baselineResolved: 0,
  };

  const passwords = {
    admin: "Admin12345!",
    it: "It12345!",
    userA: "UserA12345!",
    userB: "UserB12345!",
  };

  const emails = {
    admin: `int_admin_${suffix}@example.com`,
    it: `int_it_${suffix}@example.com`,
    userA: `int_usera_${suffix}@example.com`,
    userB: `int_userb_${suffix}@example.com`,
  };

  async function createUser(email, role, password, name) {
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
    const res = await request(app).post("/api/login").send({ email, password });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    return res.body.token;
  }

  beforeAll(async () => {
    const room = await prisma.room.create({
      data: {
        roomNumber: `INT_ROOM_${suffix}`,
        floor: 9,
        building: "INT",
      },
    });
    state.roomId = room.id;

    const category = await prisma.category.create({
      data: {
        name: `INT_CATEGORY_${suffix}`,
      },
    });
    state.categoryId = category.id;

    state.users.admin = await createUser(emails.admin, "admin", passwords.admin, "Int Admin");
    state.users.it = await createUser(emails.it, "it_support", passwords.it, "Int IT");
    state.users.userA = await createUser(emails.userA, "user", passwords.userA, "Int User A");
    state.users.userB = await createUser(emails.userB, "user", passwords.userB, "Int User B");

    state.baselineResolved = state.users.it.totalResolved || 0;

    state.tokens.admin = await login(emails.admin, passwords.admin);
    state.tokens.it = await login(emails.it, passwords.it);
    state.tokens.userA = await login(emails.userA, passwords.userA);
    state.tokens.userB = await login(emails.userB, passwords.userB);

    state.ticketForIT = await prisma.ticket.create({
      data: {
        title: `INT_IT_FLOW_${suffix}`,
        description: "Ticket used for IT accept/close integration flow",
        urgency: "High",
        status: "not_start",
        roomId: state.roomId,
        categoryId: state.categoryId,
        createdById: state.users.userA.id,
      },
    });

    state.ticketForReport = await prisma.ticket.create({
      data: {
        title: `INT_REPORT_FLOW_${suffix}`,
        description: "Ticket used for report endpoint integration flow",
        urgency: "Low",
        status: "completed",
        roomId: state.roomId,
        categoryId: state.categoryId,
        createdById: state.users.userA.id,
        assignedToId: state.users.it.id,
        acceptedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        responseTime: 5,
        resolutionTime: 55,
      },
    });

    const noteA = await prisma.notification.create({
      data: {
        userId: state.users.userA.id,
        title: "Owned by A",
        message: "Security scope test",
        type: "ticket_update",
      },
    });
    state.noteUserAId = noteA.id;

    const noteB = await prisma.notification.create({
      data: {
        userId: state.users.userB.id,
        title: "Owned by B",
        message: "Security scope test",
        type: "ticket_update",
      },
    });
    state.noteUserBId = noteB.id;
  });

  afterAll(async () => {
    const userIds = [state.users.admin?.id, state.users.it?.id, state.users.userA?.id, state.users.userB?.id].filter(Boolean);
    const ticketIds = [state.ticketForIT?.id, state.ticketForReport?.id].filter(Boolean);
    const noteIds = [state.noteUserAId, state.noteUserBId].filter(Boolean);

    await prisma.notification.deleteMany({
      where: {
        OR: [
          noteIds.length > 0 ? { id: { in: noteIds } } : undefined,
          ticketIds.length > 0 ? { ticketId: { in: ticketIds } } : undefined,
          userIds.length > 0 ? { userId: { in: userIds } } : undefined,
        ].filter(Boolean),
      },
    });

    if (ticketIds.length > 0) {
      await prisma.ticket.deleteMany({ where: { id: { in: ticketIds } } });
    }

    if (state.roomId) {
      await prisma.room.deleteMany({ where: { id: state.roomId } });
    }

    if (state.categoryId) {
      await prisma.category.deleteMany({ where: { id: state.categoryId } });
    }

    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }

    await prisma.$disconnect().catch(() => {});
  });

  it("enforces admin access on dashboard stats endpoint", async () => {
    const denied = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${state.tokens.userA}`);
    expect(denied.statusCode).toBe(403);

    const ok = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${state.tokens.admin}`);

    expect(ok.statusCode).toBe(200);
    expect(ok.body).toEqual(
      expect.objectContaining({
        ticketCount: expect.any(Number),
        itStaffCount: expect.any(Number),
        roomCount: expect.any(Number),
        equipmentCount: expect.any(Number),
        resolutionRate: expect.any(Number),
      }),
    );
  });

  it("allows IT to accept and close a ticket while updating SLA and metrics", async () => {
    const accepted = await request(app)
      .put(`/api/it/accept/${state.ticketForIT.id}`)
      .set("Authorization", `Bearer ${state.tokens.it}`)
      .send({});

    expect(accepted.statusCode).toBe(200);
    expect(accepted.body.status).toBe("in_progress");
    expect(accepted.body.assignedToId).toBe(state.users.it.id);
    expect(accepted.body.acceptedAt).toBeDefined();

    const acceptedNotification = await prisma.notification.findFirst({
      where: {
        ticketId: state.ticketForIT.id,
        userId: state.users.userA.id,
        type: "ticket_accepted",
      },
    });
    expect(acceptedNotification).toBeTruthy();

    const closed = await request(app)
      .put(`/api/it/close/${state.ticketForIT.id}`)
      .set("Authorization", `Bearer ${state.tokens.it}`)
      .send({
        note: "Fixed in integration test",
        checklist: [{ id: 1, text: "Verify issue", checked: true }],
      });

    expect(closed.statusCode).toBe(200);
    expect(closed.body.status).toBe("completed");
    expect(closed.body.completedAt).toBeDefined();
    expect(closed.body.resolutionTime).toEqual(expect.any(Number));

    const updatedIt = await prisma.user.findUnique({ where: { id: state.users.it.id } });
    expect(updatedIt.totalResolved).toBe(state.baselineResolved + 1);

    const resolvedNotification = await prisma.notification.findFirst({
      where: {
        ticketId: state.ticketForIT.id,
        userId: state.users.userA.id,
        type: "ticket_resolved",
      },
    });
    expect(resolvedNotification).toBeTruthy();
  });

  it("serves admin report endpoints and blocks non-admin users", async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const monthly = await request(app)
      .get(`/api/reports/monthly?month=${month}&year=${year}`)
      .set("Authorization", `Bearer ${state.tokens.admin}`);

    expect(monthly.statusCode).toBe(200);
    expect(monthly.body).toEqual(
      expect.objectContaining({
        total: expect.any(Number),
        resolutionRate: expect.anything(),
        data: expect.any(Array),
      }),
    );

    const performance = await request(app)
      .get(`/api/reports/performance?startDate=${year}-01-01&endDate=${year}-12-31`)
      .set("Authorization", `Bearer ${state.tokens.admin}`);

    expect(performance.statusCode).toBe(200);
    expect(Array.isArray(performance.body)).toBe(true);

    const denied = await request(app)
      .get(`/api/reports/monthly?month=${month}&year=${year}`)
      .set("Authorization", `Bearer ${state.tokens.userA}`);
    expect(denied.statusCode).toBe(403);
  });

  it("scopes notification read/delete operations to the owner", async () => {
    const unauthorizedRead = await request(app)
      .put(`/api/notification/${state.noteUserBId}/read`)
      .set("Authorization", `Bearer ${state.tokens.userA}`);
    expect(unauthorizedRead.statusCode).toBe(404);

    const ownerRead = await request(app)
      .put(`/api/notification/${state.noteUserBId}/read`)
      .set("Authorization", `Bearer ${state.tokens.userB}`);
    expect(ownerRead.statusCode).toBe(200);

    const ownerDelete = await request(app)
      .delete(`/api/notification/${state.noteUserBId}`)
      .set("Authorization", `Bearer ${state.tokens.userB}`);
    expect(ownerDelete.statusCode).toBe(200);

    const stillThere = await prisma.notification.findUnique({ where: { id: state.noteUserBId } });
    expect(stillThere).toBeNull();

    const listOwnerA = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${state.tokens.userA}`);
    expect(listOwnerA.statusCode).toBe(200);
    expect(Array.isArray(listOwnerA.body)).toBe(true);
    expect(listOwnerA.body.some((n) => n.id === state.noteUserAId)).toBe(true);
  });
});
