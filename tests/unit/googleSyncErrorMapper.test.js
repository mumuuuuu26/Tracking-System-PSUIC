const { mapGoogleSyncError } = require("../../utils/googleSyncErrorMapper");

describe("mapGoogleSyncError", () => {
  it("maps missing server credentials to 503", () => {
    const mapped = mapGoogleSyncError({
      code: "GOOGLE_CALENDAR_NOT_CONFIGURED",
      missingKeys: ["GOOGLE_PRIVATE_KEY"],
    });

    expect(mapped).toEqual({
      status: 503,
      body: {
        message:
          "Google Calendar is not configured on this server yet. Please set GOOGLE_PROJECT_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, then restart backend.",
        missingKeys: ["GOOGLE_PRIVATE_KEY"],
      },
    });
  });

  it("maps certificate-chain failures to 503 instead of generic 500", () => {
    const mapped = mapGoogleSyncError({
      code: "GOOGLE_CALENDAR_API_ERROR",
      rawCode: "SELF_SIGNED_CERT_IN_CHAIN",
      rawMessage:
        "request to https://www.googleapis.com/calendar/v3/calendars/abc/events failed, reason: self-signed certificate in certificate chain",
    });

    expect(mapped?.status).toBe(503);
    expect(mapped?.body?.message.toLowerCase()).toContain("certificate");
  });

  it("maps unknown upstream google api errors to 502", () => {
    const mapped = mapGoogleSyncError({
      code: "GOOGLE_CALENDAR_API_ERROR",
      rawStatus: 500,
      rawMessage: "Google API Failed: backend error",
    });

    expect(mapped).toEqual({
      status: 502,
      body: {
        message:
          "Google Calendar sync failed due to upstream service/network issue. Please retry shortly.",
      },
    });
  });
});
