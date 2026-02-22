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
  await prisma.$disconnect().catch(() => {});

  try {
    const { logger } = require("../utils/logger");
    logger.transports.forEach((transport) => {
      if (typeof transport.close === "function") {
        transport.close();
      }
    });
  } catch (_) {
    // no-op: logger might not be initialized in some isolated test runs
  }
});
