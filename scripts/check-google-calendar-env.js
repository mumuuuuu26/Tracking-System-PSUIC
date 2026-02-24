require("../config/env");
const { google } = require("googleapis");

const REQUIRED_KEYS = ["GOOGLE_PROJECT_ID", "GOOGLE_CLIENT_EMAIL", "GOOGLE_PRIVATE_KEY"];
const SCOPES = ["https://www.googleapis.com/auth/calendar"];
const CERT_CHAIN_HINTS = [
  "self-signed certificate",
  "unable to verify the first certificate",
  "unable to get local issuer certificate",
  "certificate in certificate chain",
];

const isTruthy = (value) => Boolean(value && String(value).trim().length > 0);

const normalizePrivateKey = (value) => {
  if (!value) return "";
  let normalized = String(value)
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "");

  const beginMarker = "-----BEGIN PRIVATE KEY-----";
  const endMarker = "-----END PRIVATE KEY-----";
  const beginIndex = normalized.indexOf(beginMarker);
  const endIndex = normalized.indexOf(endMarker);
  if (beginIndex !== -1 && endIndex !== -1 && endIndex > beginIndex) {
    normalized = normalized.slice(beginIndex, endIndex + endMarker.length);
  }

  if (!normalized.endsWith("\n")) {
    normalized = `${normalized}\n`;
  }

  return normalized;
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

  const isCertChainBlocked = (error) => {
    const text = String(error?.message || "").toLowerCase();
    return CERT_CHAIN_HINTS.some((hint) => text.includes(hint));
  };

  try {
    await auth.getClient();
  } catch (error) {
    if (isCertChainBlocked(error)) {
      console.error(
        "[GOOGLE CHECK] Auth failed: outbound HTTPS is intercepted by self-signed cert chain on this network.",
      );
      process.exit(1);
    }
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
    if (isCertChainBlocked(error)) {
      console.error(
        `[GOOGLE CHECK] Calendar access failed for "${calendarId}": outbound HTTPS is intercepted by self-signed cert chain on this network.`,
      );
      process.exit(1);
    }
    console.error(`[GOOGLE CHECK] Calendar access failed for "${calendarId}": ${error.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`[GOOGLE CHECK] Unexpected error: ${error.message}`);
  process.exit(1);
});
