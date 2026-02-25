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
            subject: 'New Ticket #{{ticketId}}: {{title}}',
            body: `
                <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;max-width:640px">
                    <h2 style="margin:0 0 12px;color:#1e3a5f;">New Ticket Created</h2>
                    <p style="margin:0 0 16px;">A new ticket was submitted and requires IT review.</p>
                    <table style="border-collapse:collapse;width:100%;margin-bottom:16px;">
                        <tr><td style="padding:8px;border:1px solid #e5e7eb;width:38%;"><b>Ticket ID</b></td><td style="padding:8px;border:1px solid #e5e7eb;">#{{ticketId}}</td></tr>
                        <tr><td style="padding:8px;border:1px solid #e5e7eb;"><b>Title</b></td><td style="padding:8px;border:1px solid #e5e7eb;">{{title}}</td></tr>
                        <tr><td style="padding:8px;border:1px solid #e5e7eb;"><b>Description</b></td><td style="padding:8px;border:1px solid #e5e7eb;">{{description}}</td></tr>
                        <tr><td style="padding:8px;border:1px solid #e5e7eb;"><b>Status</b></td><td style="padding:8px;border:1px solid #e5e7eb;">{{status}}</td></tr>
                        <tr><td style="padding:8px;border:1px solid #e5e7eb;"><b>Urgency</b></td><td style="padding:8px;border:1px solid #e5e7eb;">{{urgency}}</td></tr>
                        <tr><td style="padding:8px;border:1px solid #e5e7eb;"><b>Category / Subcomponent</b></td><td style="padding:8px;border:1px solid #e5e7eb;">{{category}} / {{subComponent}}</td></tr>
                        <tr><td style="padding:8px;border:1px solid #e5e7eb;"><b>Room / Location</b></td><td style="padding:8px;border:1px solid #e5e7eb;">Room {{room}}, Floor {{floor}}, {{building}}</td></tr>
                        <tr><td style="padding:8px;border:1px solid #e5e7eb;"><b>Equipment</b></td><td style="padding:8px;border:1px solid #e5e7eb;">{{equipment}} ({{equipmentType}})</td></tr>
                        <tr><td style="padding:8px;border:1px solid #e5e7eb;"><b>Reporter</b></td><td style="padding:8px;border:1px solid #e5e7eb;">{{reporterName}} ({{reporterEmail}} / {{reporterPhone}})</td></tr>
                        <tr><td style="padding:8px;border:1px solid #e5e7eb;"><b>Created At</b></td><td style="padding:8px;border:1px solid #e5e7eb;">{{createdAt}}</td></tr>
                    </table>
                    <p style="margin:16px 0 0;">
                        <a href="{{link}}" style="display:inline-block;background:#1f4b85;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">
                            Open Ticket
                        </a>
                    </p>
                </div>
            `,
            variables: JSON.stringify([
                'ticketId',
                'title',
                'description',
                'status',
                'urgency',
                'category',
                'subComponent',
                'room',
                'floor',
                'building',
                'equipment',
                'equipmentType',
                'reporterName',
                'reporterEmail',
                'reporterPhone',
                'createdAt',
                'link'
            ]),
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
