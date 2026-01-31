const { google } = require('googleapis');

// Load credentials from environment variables or a JSON file
// For this implementation, we'll assume they are in env vars or we'll mock if missing
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const getAuthClient = () => {
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (privateKey) {
        // Strip leading/trailing quotes (single or double) if present
        privateKey = privateKey.replace(/^["']|["']$/g, '');
        
        // Handle escaped newlines or real newlines
        // If it was a JSON string content, it might have \n chars. 
        // If it was a multiline string, it has real newlines.
        // We replace literal \n with real newlines just in case.
        privateKey = privateKey.replace(/\\n/g, '\n'); 
        
        // Remove carriage returns to be safe
        privateKey = privateKey.replace(/\r/g, '');
    }

    const credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
        project_id: process.env.GOOGLE_PROJECT_ID,
    };

    if (!credentials.client_email || !credentials.private_key) {
        console.warn('Google Credentials missing. Calendar sync will be mocked.');
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
        console.error('Error creating Google Calendar event:', error);
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
        console.error('Error updating Google Calendar event:', error);
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
        console.error('Error deleting Google Calendar event:', error);
        return false;
    }
}

exports.listGoogleEvents = async (timeMin, timeMax) => {
    try {
        const auth = getAuthClient();
        if (!auth) {
            // Mock data if no credentials

            return [
                {
                    id: 'mock-1',
                    summary: 'Mock Meeting',
                    start: { dateTime: new Date().toISOString() },
                    end: { dateTime: new Date(Date.now() + 3600000).toISOString() },
                    description: "This is a mock event because Google Credentials are missing."
                }
            ];
        }

        const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
        const calendar = google.calendar({ version: 'v3', auth });
        
        // Fetching events from calendar
        
        const res = await calendar.events.list({
            calendarId: calendarId,
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        return res.data.items;
    } catch (error) {
        console.error('Error listing Google Calendar events:', error);
        return [];
    }
};
