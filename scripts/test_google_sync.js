const { listGoogleEvents } = require('../controllers/googleCalendar');
require('dotenv').config();

async function testSync() {
    console.log('--- Testing Google Calendar Sync ---');
    // console.log('Project ID:', process.env.GOOGLE_PROJECT_ID);
    // console.log('Client Email:', process.env.GOOGLE_CLIENT_EMAIL);
    // console.log('Calendar ID:', process.env.GOOGLE_CALENDAR_ID);
    // console.log('Private Key Length:', process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.length : 0);

    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 30);

    console.log(`Fetching events from ${start.toISOString()} to ${end.toISOString()}...`);

    try {
        // const auth = getAuthClient(); // Not exported
        // Note: listGoogleEvents calls getAuthClient internally, but we want to see what it produced.
        // We can't easily inspect internal vars of the module unless we export them or modify the module.
        // Let's modify the module to export the processed key or just inspect process.env here.
        
        // console.log('--- Key Inspection ---');
        // let pk = process.env.GOOGLE_PRIVATE_KEY || '';
        // console.log('Raw Env Length:', pk.length);
        // console.log('First 50 chars:', pk.slice(0, 50));
        // console.log('Contains literal \\n:', pk.includes('\\n'));
        // console.log('Contains real newline:', pk.includes('\n'));
        
        // const targetCalendarId = 'psuichelpdesk@gmail.com'; // From user screenshot
        // console.log(`Attempting to sync from: ${targetCalendarId}`);
        const events = await listGoogleEvents(start, end);
        console.log(`Found ${events.length} events.`);
        if (events.length > 0) {
            console.log('First event:', events[0].summary, 'at', events[0].start.dateTime || events[0].start.date);
        } else {
            console.log('No events found. Possible reasons:');
            console.log('1. Calendar ID is wrong.');
            console.log('2. Calendar is not shared with the service account.');
            console.log('3. No events in this date range.');
        }
    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

testSync();
