const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

const requiredSelectors = [
  {
    file: "client/src/pages/it/Tickets.jsx",
    patterns: [
      'data-testid={`it-filter-status-${status.value}`}',
      'testId="it-filter-floor"',
      'testId="it-filter-room"',
    ],
  },
  {
    file: "client/src/pages/user/Report.jsx",
    patterns: [
      'data-testid={`user-report-filter-status-${opt.value}`}',
      'testId="filter-floor"',
      'testId="filter-room"',
    ],
  },
  {
    file: "client/src/components/user/TicketHistory.jsx",
    patterns: [
      'data-testid="user-history-filter-category-all"',
      'data-testid={`user-history-filter-category-${cat.id}`}',
      'testId="history-filter-floor"',
      'testId="history-filter-room"',
      'data-testid="ticket-table"',
    ],
  },
];

const missing = [];

for (const { file, patterns } of requiredSelectors) {
  const absolute = path.join(rootDir, file);
  let content = "";

  try {
    content = fs.readFileSync(absolute, "utf8");
  } catch (error) {
    missing.push(`[MISSING FILE] ${file}: ${error.message}`);
    continue;
  }

  for (const pattern of patterns) {
    if (!content.includes(pattern)) {
      missing.push(`[MISSING SELECTOR] ${file} -> ${pattern}`);
    }
  }
}

if (missing.length > 0) {
  console.error("[E2E SELECTOR CHECK] FAILED");
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log("[E2E SELECTOR CHECK] OK");
