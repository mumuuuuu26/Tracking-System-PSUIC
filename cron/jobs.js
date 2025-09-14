const cron = require("node-cron");
const { refreshFromSource } = require("../controllers/price");

const expressLike = () => {
  const req = { body: {} };
  const res = {
    json: (x) => console.log("[CRON] saved:", x),
    status: (c) => ({ json: (x) => console.log("[CRON]", c, x) }),
  };
  return { req, res };
};

function startJobs() {
  const spec = process.env.CRON_SCHEDULE || "5 8 * * *"; // 08:05 ทุกวัน
  cron.schedule(
    spec,
    async () => {
      try {
        console.log("[CRON] Fetch palm price start");
        const { req, res } = expressLike();
        await refreshFromSource(req, res);
        console.log("[CRON] Fetch palm price done");
      } catch (err) {
        console.error("[CRON] error", err);
      }
    },
    { timezone: process.env.TZ || "Asia/Bangkok" }
  );
}

module.exports = { startJobs };
