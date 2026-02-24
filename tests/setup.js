const prisma = require("../config/prisma");
const shouldSkipDbConnect = ["1", "true"].includes(
  String(process.env.TEST_SKIP_DB_CONNECT).toLowerCase(),
);

beforeAll(async () => {
  if (shouldSkipDbConnect) {
    return;
  }

  try {
    await prisma.$connect();
  } catch (err) {
    throw new Error(
      `Failed to connect to test database. Ensure MySQL is running and DATABASE_URL is valid. Original error: ${err.message}`
    );
  }
});

afterAll(async () => {
  if (!shouldSkipDbConnect) {
    await prisma.$disconnect().catch(() => {});
  }

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
