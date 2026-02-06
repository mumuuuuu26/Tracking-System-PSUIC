const request = require("supertest");
const app = require("../server"); // Ensure server.js exports 'app' (might need refactor if it only listens)

// We need to make sure server.js exports 'app' without listening effectively during tests, 
// or supertest handles the listening server.
// If server.js starts listening immediately, we might have port conflicts.
// Ideally, server.js exports { app, server } or just app, and index.js starts it.
// For now, let's assume we can require it.

describe("Auth Endpoints", () => {
  it("should register a new user", async () => {
    const uniqueEmail = `test_${Date.now()}@example.com`;
    const res = await request(app)
      .post("/api/register")
      .send({
        email: uniqueEmail,
        password: "password123"
      });
    // This might fail if user exists from previous run.
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("message", "Register Success");
  });

  it("should login successfully", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({
        email: "test@example.com",
        password: "password123"
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
  });

  it("should fail validation for short password", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({
        email: "fail@test.com",
        password: "123" // Short
      });
    expect(res.statusCode).toEqual(400); // Zod Error
  });
});
