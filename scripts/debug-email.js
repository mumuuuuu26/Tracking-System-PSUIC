const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log("--- Checking Email Configuration ---");
    
    // 1. Check Env Vars
    const hasUser = !!process.env.MAIL_USER;
    const hasPass = !!process.env.MAIL_PASS;
    console.log(`MAIL_USER set: ${hasUser}`);
    console.log(`MAIL_PASS set: ${hasPass}`);
    
    // 2. Check Template
    const templateName = 'new_ticket_it';
    const template = await prisma.emailTemplate.findUnique({
        where: { name: templateName }
    });
    
    if (template) {
        console.log(`Template '${templateName}' found:`);
        console.log(`- isEnabled: ${template.isEnabled}`);
        console.log(`- Subject: ${template.subject}`);
    } else {
        console.error(`❌ Template '${templateName}' NOT found!`);
        console.log("--> This is likely the cause of blocked emails.");
    }

    // 3. Check IT Users
    const itUsers = await prisma.user.findMany({
        where: { role: 'it_support' },
        select: { email: true, isEmailEnabled: true, notificationEmail: true }
    });

    console.log(`\nFound ${itUsers.length} IT Support users:`);
    itUsers.forEach(u => {
        console.log(`- ${u.email}: isEmailEnabled=${u.isEmailEnabled}, notify=${u.notificationEmail}`);
    });
}

check()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
