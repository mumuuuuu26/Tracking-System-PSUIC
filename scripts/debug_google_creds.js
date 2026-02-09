const { google } = require('googleapis');
require('dotenv').config();

console.log('--- Google Credentials Debug ---');
const projectId = process.env.GOOGLE_PROJECT_ID;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
let privateKey = process.env.GOOGLE_PRIVATE_KEY;

console.log('Project ID:', projectId ? '✅ Present' : '❌ Missing');
console.log('Client Email:', clientEmail ? '✅ Present' : '❌ Missing');
console.log('Private Key:', privateKey ? '✅ Present' : '❌ Missing');

if (privateKey) {
    console.log('Private Key Length:', privateKey.length);
    console.log('Starts with -----BEGIN PRIVATE KEY-----:', privateKey.startsWith('-----BEGIN PRIVATE KEY-----') ? '✅ Yes' : '❌ No');
    console.log('Ends with -----END PRIVATE KEY-----:', privateKey.trim().endsWith('-----END PRIVATE KEY-----') ? '✅ Yes' : '❌ No');
    console.log('Contains literal \\n:', privateKey.includes('\\n') ? '⚠️ Yes (Might need replacement)' : 'No');
    console.log('Contains real newline:', privateKey.includes('\n') ? '✅ Yes' : '❌ No');
    
    // Simulate the replacement logic in googleCalendar.js
    let processedKey = privateKey.replace(/^["']|["']$/g, '');
    processedKey = processedKey.replace(/\\n/g, '\n');
    processedKey = processedKey.replace(/\r/g, '');
    
    console.log('Processed Key Valid Structure:', (processedKey.includes('-----BEGIN PRIVATE KEY-----') && processedKey.includes('\n')) ? '✅ Yes' : '❌ No');
}

console.log('--- Attempting Auth ---');
try {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey ? privateKey.replace(/\\n/g, '\n') : undefined,
            project_id: projectId,
        },
        scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    console.log('Auth Object Created Successfully');
    
    auth.getClient().then(client => {
        console.log('✅ Client created successfully (Credentials likely valid format)');
    }).catch(err => {
        console.error('❌ Client creation failed:', err.message);
    });

} catch (err) {
    console.error('❌ Auth instantiation failed:', err.message);
}
