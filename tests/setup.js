const prisma = require("../config/prisma");

beforeAll(async () => {
  try {
    // Connect to the database
    await prisma.$connect();
    console.log("Connected to test database");
  } catch (err) {
    console.error("Failed to connect to test database:", err);
    process.exit(1);
  }
});

afterAll(async () => {
  // Disconnect from the database
  await prisma.$disconnect();
});
