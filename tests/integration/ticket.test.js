const request = require("supertest");
const app = require("../../server");
const prisma = require("../../config/prisma");

describe("Ticket API Integration", () => {
  let userToken;
  let testUserEmail;
  let testRoomId;
  let testCategoryId;
  
  beforeAll(async () => {
    // 0. Setup prerequisites (Room, Category)
    // Try to find existing or create new
    const room = await prisma.room.create({
        data: {
            roomNumber: `TestRoom_${Date.now()}`,
            floor: 1
        }
    });
    testRoomId = room.id;

    const category = await prisma.category.create({
        data: {
            name: `TestCat_${Date.now()}`
        }
    });
    testCategoryId = category.id;

    // 1. Create a test user
    testUserEmail = `integration_ticket_${Date.now()}@example.com`;
    await request(app).post("/api/register").send({
      email: testUserEmail,
      password: "password123",
      name: "Integration Test User",
      role: "User"
    });

    // 2. Login to get token
    const loginRes = await request(app).post("/api/login").send({
      email: testUserEmail,
      password: "password123"
    });
    
    userToken = loginRes.body.token;
  });

  afterAll(async () => {
    // Cleanup
    try {
        const user = await prisma.user.findUnique({ where: { email: testUserEmail } });
        if (user) {
            // Delete tickets created by user
            await prisma.ticket.deleteMany({ where: { createdById: user.id } });
            await prisma.user.delete({ where: { id: user.id } });
        }
        // Delete resources
        if (testRoomId) await prisma.room.delete({ where: { id: testRoomId } });
        if (testCategoryId) await prisma.category.delete({ where: { id: testCategoryId } });
    } catch (err) {
        console.warn("Cleanup failed:", err.message);
    }
    // Setup file handles prisma.$disconnect()
  });

  describe("POST /api/ticket", () => {
    it("should create a new ticket successfully", async () => {
      const res = await request(app)
        .post("/api/ticket")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          title: "Test Ticket Title",
          description: "This is a test ticket description.",
          priority: "Medium", // Controller expects 'urgency' not 'priority' but let's check payload mapping?
          urgency: "Medium",
          categoryId: testCategoryId,
          roomId: testRoomId,
          type: "Request" // might be ignored but harmless
        });

      if (res.statusCode !== 201 && res.statusCode !== 200) {
        console.error("Create Ticket Error:", res.body);
      }

      expect([200, 201]).toContain(res.statusCode);
      expect(res.body).toHaveProperty("title"); // Title is auto-generated in controller as "[Category] Issue" usually? 
      // Controller: title: `${getCategoryName(form.categoryId)} Issue` ? NO.
      // Controller: title: title (from body).
      // Wait, controller uses `title` from body.
      // So expect title to be "Test Ticket Title".
      expect(res.body).toHaveProperty("title", "Test Ticket Title");
    });

    it("should fail without authentication", async () => {
      const res = await request(app)
        .post("/api/ticket")
        .send({
          title: "Unauth Ticket"
        });
      
      expect(res.statusCode).toBeOneOf([401, 403]);
    });
  });

  describe("GET /api/ticket", () => {
    it("should retrieve the user's tickets", async () => {
      const res = await request(app)
        .get("/api/ticket") // Fixed route
        .set("Authorization", `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Verify the ticket created above is present
      const found = res.body.find(t => t.title === "Test Ticket Title");
      expect(found).toBeDefined();
    });
  });
});

expect.extend({
  toBeOneOf(received, validValues) {
    const pass = validValues.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${validValues}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${validValues}`,
        pass: false,
      };
    }
  },
});
