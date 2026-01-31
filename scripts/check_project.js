const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function checkSystem() {
    console.log('🔍 Starting System Check...\n');

    // 1. Check Environment Variables
    console.log('1️⃣  Checking Environment Variables...');
    const requiredVars = ['DATABASE_URL', 'GOOGLE_PROJECT_ID', 'GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY', 'GOOGLE_CALENDAR_ID'];
    let envOk = true;
    requiredVars.forEach(v => {
        if (!process.env[v]) {
            console.error(`   ❌ Missing ${v}`);
            envOk = false;
        } else {
            console.log(`   ✅ ${v} is set`);
        }
    });

    if (process.env.GOOGLE_PRIVATE_KEY) {
        // Validate Key Format
        let pk = process.env.GOOGLE_PRIVATE_KEY;
        if (pk.startsWith('"') && pk.endsWith('"')) {
            try { pk = JSON.parse(pk); } catch (e) {}
        }
        pk = pk.replace(/\\n/g, '\n');
        
        if (pk.includes('-----BEGIN PRIVATE KEY-----') && pk.includes('\n')) {
            console.log('   ✅ Valid Private Key Format');
        } else {
            console.error('   ❌ Invalid Private Key Format (Check newlines)');
            envOk = false;
        }
    }

    // 2. Check Database Connection
    console.log('\n2️⃣  Checking Database Connection...');
    try {
        await prisma.$connect();
        const userCount = await prisma.user.count();
        console.log(`   ✅ Database connected! Found ${userCount} users.`);
    } catch (e) {
        console.error('   ❌ Database connection failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }

    // 3. Check Google Calendar Auth (Without API Call)
    console.log('\n3️⃣  Checking Google Authentication Config...');
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                project_id: process.env.GOOGLE_PROJECT_ID,
            },
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });
        const client = await auth.getClient();
        console.log('   ✅ Google Auth Client created successfully');
    } catch (e) {
        console.error('   ❌ Google Auth Client creation failed:', e.message);
    }
    
    console.log('\n🏁 System Check Complete.');
}

checkSystem();
