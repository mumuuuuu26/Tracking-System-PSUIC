const prisma = require("../config/prisma");

beforeAll(async () => {
  try {
    await prisma.$connect();
  } catch (err) {
    throw new Error(
      `Failed to connect to test database. Ensure MySQL is running and DATABASE_URL is valid. Original error: ${err.message}`
    );
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
