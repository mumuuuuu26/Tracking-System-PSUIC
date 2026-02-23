require("../config/env");
const { google } = require("googleapis");

const REQUIRED_KEYS = ["GOOGLE_PROJECT_ID", "GOOGLE_CLIENT_EMAIL", "GOOGLE_PRIVATE_KEY"];
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

const isTruthy = (value) => Boolean(value && String(value).trim().length > 0);

const normalizePrivateKey = (value) => {
  if (!value) return "";
  return String(value)
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "");
};

const maskEmail = (email) => {
  if (!email || !email.includes("@")) return "(not set)";
  const [local, domain] = email.split("@");
  if (!local) return `***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
};

async function main() {
  const missingKeys = REQUIRED_KEYS.filter((key) => !isTruthy(process.env[key]));
  if (missingKeys.length > 0) {
    console.error(
      `[GOOGLE CHECK] Missing required env vars: ${missingKeys.join(", ")}`
    );
    process.exit(1);
  }

  const credentials = {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    project_id: process.env.GOOGLE_PROJECT_ID,
  };

  if (!credentials.private_key.includes("BEGIN PRIVATE KEY")) {
    console.error(
      "[GOOGLE CHECK] GOOGLE_PRIVATE_KEY format looks invalid (missing BEGIN PRIVATE KEY)."
    );
    process.exit(1);
  }

  console.log(`[GOOGLE CHECK] Project: ${credentials.project_id}`);
  console.log(`[GOOGLE CHECK] Service account: ${maskEmail(credentials.client_email)}`);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  try {
    await auth.getClient();
  } catch (error) {
    console.error(`[GOOGLE CHECK] Auth failed: ${error.message}`);
    process.exit(1);
  }

  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  try {
    const calendar = google.calendar({ version: "v3", auth });
    const now = new Date();
    const res = await calendar.events.list({
      calendarId,
      timeMin: now.toISOString(),
      maxResults: 1,
      singleEvents: true,
      orderBy: "startTime",
    });

    const sampleCount = Array.isArray(res.data.items) ? res.data.items.length : 0;
    console.log(`[GOOGLE CHECK] Calendar access OK (${calendarId}), sample events: ${sampleCount}`);
    console.log("[GOOGLE CHECK] Google Calendar integration is ready.");
  } catch (error) {
    console.error(`[GOOGLE CHECK] Calendar access failed for "${calendarId}": ${error.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`[GOOGLE CHECK] Unexpected error: ${error.message}`);
  process.exit(1);
});
