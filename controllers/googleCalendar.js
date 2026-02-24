const { google } = require('googleapis');
const { logger } = require('../utils/logger');

// Load credentials from environment variables or a JSON file
// For this implementation, we'll assume they are in env vars or we'll mock if missing
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const GOOGLE_REQUIRED_ENV_KEYS = ['GOOGLE_PROJECT_ID', 'GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY'];

const getMissingGoogleCredentialKeys = () =>
    GOOGLE_REQUIRED_ENV_KEYS.filter((key) => {
        const value = process.env[key];
        return !value || String(value).trim().length === 0;
    });

const isGoogleCredentialsConfigured = () => getMissingGoogleCredentialKeys().length === 0;

const buildGoogleConfigError = () => {
    const missingKeys = getMissingGoogleCredentialKeys();
    const error = new Error(
        `Google Calendar is not configured on server. Missing: ${missingKeys.join(', ')}`,
    );
    error.code = 'GOOGLE_CALENDAR_NOT_CONFIGURED';
    error.statusCode = 503;
    error.missingKeys = missingKeys;
    return error;
};

const normalizePrivateKey = (privateKey) => {
    if (!privateKey) return '';

    let normalized = String(privateKey);
    // Strip leading/trailing quotes (single or double) if present
    normalized = normalized.replace(/^["']|["']$/g, '');
    // Convert escaped newlines to real newlines
    normalized = normalized.replace(/\\n/g, '\n');
    // Remove carriage returns
    normalized = normalized.replace(/\r/g, '');

    // If .env was malformed (e.g. GOOGLE_PRIVATE_KEY and next KEY ended up on one line),
    // keep only the PEM block to avoid breaking Google auth parsing.
    const beginMarker = "-----BEGIN PRIVATE KEY-----";
    const endMarker = "-----END PRIVATE KEY-----";
    const beginIndex = normalized.indexOf(beginMarker);
    const endIndex = normalized.indexOf(endMarker);
    if (beginIndex !== -1 && endIndex !== -1 && endIndex > beginIndex) {
        normalized = normalized.slice(beginIndex, endIndex + endMarker.length);
    }

    if (!normalized.endsWith('\n')) {
        normalized = `${normalized}\n`;
    }
    return normalized;
};

const getAuthClient = () => {
    const missingKeys = getMissingGoogleCredentialKeys();
    if (missingKeys.length > 0) {
        logger.warn(
            `[GoogleCalendar] Missing credentials: ${missingKeys.join(', ')}. Calendar sync is disabled.`,
        );
        return null;
    }

    const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);
    const credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
        project_id: process.env.GOOGLE_PROJECT_ID,
    };

    if (!credentials.client_email || !credentials.private_key || !credentials.project_id) {
        logger.warn('[GoogleCalendar] Credentials are incomplete after normalization.');
        return null;
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
    });

    return auth;
};

exports.createGoogleEvent = async (eventDetails) => {
    try {
        const auth = getAuthClient();
        if (!auth) {
            return `mock-event-id-${Date.now()}`;
        }

        const calendar = google.calendar({ version: 'v3', auth });

        // eventDetails: { summary, description, start: Date, end: Date, attendees: [] }
        const event = {
            summary: eventDetails.summary,
            description: eventDetails.description,
            start: {
                dateTime: eventDetails.start.toISOString(),
                timeZone: 'Asia/Bangkok',
            },
            end: {
                dateTime: eventDetails.end.toISOString(),
                timeZone: 'Asia/Bangkok',
            },
            attendees: eventDetails.attendees || [],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 10 },
                ],
            },
        };

        const res = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        return res.data.id;
    } catch (error) {
        logger.error('Error creating Google Calendar event:', error);
        // Return null or throw depending on how strict we want to be
        // For now, return null so we don't break the app flow if google fails
        return null;
    }
};

exports.updateGoogleEvent = async (eventId, eventDetails) => {
    try {
        const auth = getAuthClient();
        if (!auth) return true; // Mock success

        const calendar = google.calendar({ version: 'v3', auth });

        const event = {
            summary: eventDetails.summary,
            description: eventDetails.description,
            start: {
                dateTime: new Date(eventDetails.start).toISOString(),
                timeZone: 'Asia/Bangkok',
            },
            end: {
                dateTime: new Date(eventDetails.end).toISOString(),
                timeZone: 'Asia/Bangkok',
            },
        };

        await calendar.events.patch({
            calendarId: 'primary',
            eventId: eventId,
            resource: event,
        });

        return true;
    } catch (error) {
        logger.error('Error updating Google Calendar event:', error);
        return false;
    }
};

exports.deleteGoogleEvent = async (eventId) => {
    try {
        const auth = getAuthClient();
        if (!auth) return true;

        const calendar = google.calendar({ version: 'v3', auth });
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId
        });
        return true;
    } catch (error) {
        logger.error('Error deleting Google Calendar event:', error);
        return false;
    }
}

exports.listGoogleEvents = async (timeMin, timeMax, calendarId = 'primary') => {
    try {
        const auth = getAuthClient();
        if (!auth) {
            logger.warn('[GoogleCalendar] Auth failed: missing or invalid credentials');
            throw buildGoogleConfigError();
        }

        const targetCalendarId = calendarId || process.env.GOOGLE_CALENDAR_ID || 'primary';
        
        if (!targetCalendarId || typeof targetCalendarId !== 'string' || !targetCalendarId.trim()) {
            throw new Error("Invalid Calendar ID provided");
        }
        
        const calendar = google.calendar({ version: 'v3', auth });
        
        let allEvents = [];
        let pageToken = null;

        try {
            do {
                const res = await calendar.events.list({
                    calendarId: targetCalendarId,
                    timeMin: timeMin.toISOString(),
                    timeMax: timeMax.toISOString(),
                    singleEvents: true,
                    orderBy: 'startTime',
                    pageToken: pageToken,
                    maxResults: 2500 // Max allowed by Google
                });
                
                const items = res.data.items || [];
                allEvents = allEvents.concat(items);
                pageToken = res.data.nextPageToken;

            } while (pageToken);

            return allEvents;
        } catch (apiError) {
            logger.error('Google API Error Details:', apiError.message);
            const apiMessage =
                apiError?.message ||
                apiError?.response?.data?.error?.message ||
                "Unknown Google API error";
            const wrappedError = new Error(`Google API Failed: ${apiMessage}`);
            wrappedError.code = 'GOOGLE_CALENDAR_API_ERROR';
            const responseStatus = Number(apiError?.response?.status);
            const numericCode = Number(apiError?.code);
            wrappedError.statusCode =
                Number.isInteger(responseStatus) && responseStatus > 0
                    ? responseStatus
                    : Number.isInteger(numericCode) && numericCode > 0
                    ? numericCode
                    : 502;
            wrappedError.rawCode = apiError?.code;
            wrappedError.rawStatus = apiError?.response?.status;
            wrappedError.rawMessage = apiMessage;
            throw wrappedError;
        }
    } catch (error) {
        logger.error('Error listing Google Calendar events:', error);
        throw error; // Propagate error to controller
    }
};

exports.getMissingGoogleCredentialKeys = getMissingGoogleCredentialKeys;
exports.isGoogleCredentialsConfigured = isGoogleCredentialsConfigured;
