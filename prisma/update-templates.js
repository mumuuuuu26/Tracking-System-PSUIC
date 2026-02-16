const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Updating Email Templates...");

    const templates = [
        {
            name: 'ticket_accepted',
            subject: 'Ticket Accepted: {{title}}',
            body: 'Your ticket <b>{{title}}</b> has been accepted by {{assignedTo}}. We are working on it.',
            variables: JSON.stringify(['title', 'assignedTo', 'id']),
            isEnabled: true
        },
        {
            name: 'ticket_rejected',
            subject: 'Ticket Rejected: {{title}}',
            body: 'Your ticket <b>{{title}}</b> has been rejected. Reason: {{reason}}',
            variables: JSON.stringify(['title', 'reason', 'id']),
            isEnabled: true
        },
        {
            name: 'ticket_resolved_user',
            subject: 'Ticket Resolved: {{title}}',
            body: 'Your ticket has been resolved by {{resolver}}. Room: {{room}}. <br><br> <a href="{{link}}">Click here to rate us</a>',
            variables: JSON.stringify(['title', 'room', 'resolver', 'link', 'id']),
            isEnabled: true
        },
        {
            name: 'new_ticket_it',
            subject: 'New Ticket Alert: {{title}}',
            body: 'A new ticket has been created by {{reporter}}. Room: {{room}}. Urgency: {{urgency}}.<br><a href="{{link}}">View Ticket</a>',
            variables: JSON.stringify(['title', 'reporter', 'room', 'urgency', 'link', 'id']),
            isEnabled: true
        }
    ];

    for (const t of templates) {
        await prisma.emailTemplate.upsert({
            where: { name: t.name },
            update: {
                subject: t.subject,
                body: t.body,
                variables: t.variables,
                isEnabled: t.isEnabled
            },
            create: t
        });
        console.log(`Updated/Created template: ${t.name}`);
    }

    console.log("Email templates updated successfully.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
