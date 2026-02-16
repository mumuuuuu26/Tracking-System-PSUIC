const axios = require('axios');

const API_URL = 'http://localhost:5002/api';

const userCreds = {
    email: 'user@psu.ac.th',
    password: 'user123'
};

const itCreds = {
    email: 'it1@psu.ac.th',
    password: 'it123'
};

async function login(creds) {
    try {
        const res = await axios.post(`${API_URL}/login`, creds);
        return res.data.token;
    } catch (err) {
        console.error('Login failed for', creds.email, err.message);
        if (err.response) console.error(err.response.data);
        process.exit(1);
    }
}

async function createTicket(token) {
    try {
        const ticketData = {
            title: `Test Ticket ${Date.now()}`,
            description: 'This is a test ticket from reproduction script',
            urgency: 'Low',
            roomId: 1, // Assuming ID 1 exists from seed
            categoryId: 1, // Assuming ID 1 exists from seed
            equipmentId: null
        };
        const res = await axios.post(`${API_URL}/ticket`, ticketData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Ticket Created:', res.data.id, res.data.title);
        return res.data.id;
    } catch (err) {
        console.error('Create ticket failed', err.message);
        if (err.response) console.error(err.response.data);
        process.exit(1);
    }
}

async function listAllTickets(token) {
    try {
        const res = await axios.get(`${API_URL}/it/tasks`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Response format: [] (Array of tickets)
        return { data: res.data, total: res.data.length };
    } catch (err) {
        console.error('List IT tasks failed', err.message);
        if (err.response) console.error(err.response.data);
        process.exit(1);
    }
}

async function main() {
    console.log('1. Logging in as User...');
    const userToken = await login(userCreds);
    console.log('User logged in.');

    console.log('2. Logging in as IT...');
    const itToken = await login(itCreds);
    console.log('IT logged in.');

    console.log('3. Creating Ticket as User...');
    const ticketId = await createTicket(userToken);

    console.log('4. Fetching All Tickets as IT...');
    const result = await listAllTickets(itToken);
    
    console.log(`IT fetched ${result.total} tickets.`);
    
    const found = result.data.find(t => t.id === ticketId);
    
    if (found) {
        console.log('✅ SUCCESS: Ticket found in IT list!');
        console.log('Ticket Details:', {
            id: found.id,
            title: found.title,
            status: found.status,
            createdBy: found.createdBy.email
        });
    } else {
        console.error('❌ FAILURE: Ticket NOT found in IT list!');
        console.log('First 5 tickets in list:', result.data.slice(0, 5).map(t => ({id: t.id, status: t.status})));
    }
}

main();
