const CERTIFICATE_ERROR_PATTERNS = [
  "self-signed certificate",
  "unable to verify the first certificate",
  "unable to get local issuer certificate",
  "certificate has expired",
  "hostname/ip does not match certificate",
  "ssl routines",
  "tls",
];

const NETWORK_ERROR_CODES = new Set([
  "etimedout",
  "econnreset",
  "econnrefused",
  "enotfound",
  "eai_again",
  "ehostunreach",
  "enetunreach",
]);

const toNormalizedString = (value) => String(value || "").trim().toLowerCase();

const getErrorMessage = (err) =>
  String(
    err?.rawMessage ||
      err?.message ||
      err?.response?.data?.error?.message ||
      err?.response?.data?.message ||
      "",
  );

const mapGoogleSyncError = (err) => {
  const message = getErrorMessage(err);
  const normalized = toNormalizedString(message);
  const rawCode = toNormalizedString(err?.rawCode || err?.code);
  const rawStatus = Number(err?.rawStatus || err?.statusCode || err?.response?.status || 0);

  if (err?.code === "GOOGLE_CALENDAR_NOT_CONFIGURED") {
    return {
      status: 503,
      body: {
        message:
          "Google Calendar is not configured on this server yet. Please set GOOGLE_PROJECT_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, then restart backend.",
        missingKeys: err.missingKeys || [],
      },
    };
  }

  if (
    normalized.includes("calendar id is missing") ||
    normalized.includes("invalid calendar id provided")
  ) {
    return {
      status: 400,
      body: { message: "Calendar ID is missing or invalid." },
    };
  }

  if (
    normalized.includes("requested entity was not found") ||
    normalized.includes("google api failed: not found") ||
    normalized.includes("calendar id not found")
  ) {
    return {
      status: 400,
      body: {
        message: "Calendar ID not found. Please verify Calendar ID in Google Calendar settings.",
      },
    };
  }

  if (
    normalized.includes("caller does not have permission") ||
    normalized.includes("insufficient permission") ||
    normalized.includes("forbidden")
  ) {
    return {
      status: 400,
      body: {
        message:
          "Google Calendar permission denied. Share the target calendar with the service account email and grant 'Make changes to events'.",
      },
    };
  }

  if (
    normalized.includes("invalid_grant") ||
    normalized.includes("invalid jwt") ||
    normalized.includes("invalid credentials")
  ) {
    return {
      status: 503,
      body: {
        message:
          "Google credentials are invalid on server (service account key is malformed, expired, or revoked).",
      },
    };
  }

  const hasCertificateError =
    CERTIFICATE_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern)) ||
    rawCode.includes("self_signed_cert") ||
    rawCode.includes("cert_") ||
    rawCode.includes("unable_to_verify");

  if (hasCertificateError) {
    return {
      status: 503,
      body: {
        message:
          "Google sync is blocked by SSL/certificate inspection on this network. Ask network admin to allow outbound HTTPS to Google APIs without certificate interception.",
      },
    };
  }

  const hasNetworkError =
    NETWORK_ERROR_CODES.has(rawCode) ||
    normalized.includes("timeout") ||
    normalized.includes("network is unreachable") ||
    normalized.includes("socket hang up");

  if (hasNetworkError) {
    return {
      status: 503,
      body: {
        message:
          "Cannot reach Google Calendar service from this server network right now. Please try again later.",
      },
    };
  }

  if (err?.code === "GOOGLE_CALENDAR_API_ERROR") {
    if (rawStatus >= 400 && rawStatus < 500) {
      return {
        status: 400,
        body: {
          message: "Google Calendar request was rejected. Please re-check calendar sharing and credentials.",
        },
      };
    }

    return {
      status: 502,
      body: {
        message:
          "Google Calendar sync failed due to upstream service/network issue. Please retry shortly.",
      },
    };
  }

  return null;
};

module.exports = { mapGoogleSyncError };
