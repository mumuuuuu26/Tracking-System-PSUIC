require("../config/env");
const prisma = require("../config/prisma");

const RETRIES = Math.max(Number(process.env.DB_READY_RETRIES || 12), 1);
const INTERVAL_MS = Math.max(Number(process.env.DB_READY_INTERVAL_MS || 2000), 100);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function compactMessage(error) {
  const raw = error?.message || String(error || "unknown error");
  return raw.split("\n").map((line) => line.trim()).filter(Boolean)[0] || "unknown error";
}

async function checkDbReady() {
  await prisma.$connect();
  await prisma.$queryRawUnsafe("SELECT 1");
}

async function main() {
  const startedAt = Date.now();

  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      await checkDbReady();
      const elapsed = Date.now() - startedAt;
      console.log(`[DB READY] OK after ${attempt}/${RETRIES} attempt(s) (${elapsed}ms)`);
      process.exit(0);
    } catch (error) {
      const isLastAttempt = attempt === RETRIES;
      const shouldLogAttempt = attempt === 1 || attempt % 5 === 0 || isLastAttempt;

      if (shouldLogAttempt) {
        console.log(
          `[DB READY] waiting (${attempt}/${RETRIES}): ${compactMessage(error)}`,
        );
      }

      if (isLastAttempt) {
        console.error("[DB READY] FAILED: database is not reachable");
        process.exit(1);
      }
      await sleep(INTERVAL_MS);
    } finally {
      await prisma.$disconnect().catch(() => {});
    }
  }
}

main();
