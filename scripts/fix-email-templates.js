const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Fixing Email Templates...");

    // 1. Disable 'ticket_accepted' (User request to stop sending this)
    await prisma.emailTemplate.upsert({
        where: { name: 'ticket_accepted' },
        update: { isEnabled: false },
        create: {
            name: 'ticket_accepted',
            subject: 'Ticket Accepted',
            body: 'Disabled',
            variables: '[]',
            isEnabled: false
        }
    });
    console.log("❌ Disabled 'ticket_accepted' template.");

    // 2. Add 'ticket_feedback_it' (New requirement)
    // IT needs to know when user accepts/rates the work
    await prisma.emailTemplate.upsert({
        where: { name: 'ticket_feedback_it' },
        update: {
            subject: 'Feedback Received: {{title}}',
            body: 'User <b>{{rater}}</b> has accepted and rated ticket #{{ticketId}}.<br><br><b>Rating:</b> {{rating}} / 100<br><b>Feedback:</b> {{comments}}<br><br><a href="{{link}}">View Ticket</a>',
            variables: JSON.stringify(['title', 'rater', 'rating', 'comments', 'link', 'ticketId']),
            isEnabled: true
        },
        create: {
            name: 'ticket_feedback_it',
            subject: 'Feedback Received: {{title}}',
            body: 'User <b>{{rater}}</b> has accepted and rated ticket #{{ticketId}}.<br><br><b>Rating:</b> {{rating}} / 100<br><b>Feedback:</b> {{comments}}<br><br><a href="{{link}}">View Ticket</a>',
            variables: JSON.stringify(['title', 'rater', 'rating', 'comments', 'link', 'ticketId']),
            isEnabled: true
        }
    });
    console.log("✅ Created/Updated 'ticket_feedback_it' template.");

    // Verify
    const templates = await prisma.emailTemplate.findMany();
    console.log("Current Templates:", templates.map(t => `${t.name} (${t.isEnabled ? 'ON' : 'OFF'})`));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
