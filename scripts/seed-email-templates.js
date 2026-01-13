const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const templates = [
    {
        name: 'new_ticket_it',
        description: 'Notification sent to IT Support when a new ticket is created.',
        subject: '🔔 [Urgent: {{urgency}}] New Ticket #{{id}}: {{title}}',
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { background: #f3f4f6; padding: 20px; border-radius: 0 0 10px 10px; }
    .badge { padding: 5px 10px; border-radius: 5px; font-size: 12px; }
    .high { background: #ef4444; color: white; }
    .medium { background: #f59e0b; color: white; }
    .low { background: #10b981; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🛠️ New Support Ticket</h2>
    </div>
    <div class="content">
      <p><strong>Ticket ID:</strong> #{{id}}</p>
      <p><strong>Title:</strong> {{title}}</p>
      <p><strong>Priority:</strong> <span class="badge">{{urgency}}</span></p>
      <p><strong>Room:</strong> {{room}}</p>
      <p><strong>Equipment:</strong> {{equipment}}</p>
      <p><strong>Category:</strong> {{category}}</p>
      <p><strong>Description:</strong></p>
      <div style="background: white; padding: 10px; border-radius: 5px;">
        {{description}}
      </div>
      <p><strong>Reported by:</strong> {{reporter}}</p>
      <br>
      <a href="{{link}}" 
         style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Ticket
      </a>
    </div>
  </div>
</body>
</html>`,
        variables: JSON.stringify(['id', 'title', 'urgency', 'room', 'equipment', 'category', 'description', 'reporter', 'link']),
        isEnabled: true
    },
    {
        name: 'ticket_resolved_user',
        description: 'Notification sent to User when their ticket is resolved.',
        subject: '✅ Ticket #{{id}} has been resolved',
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { background: #f3f4f6; padding: 20px; border-radius: 0 0 10px 10px; }
    .success-box { background: #d1fae5; padding: 15px; border-radius: 5px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✅ Your Ticket Has Been Resolved!</h2>
    </div>
    <div class="content">
      <div class="success-box">
        <p><strong>Good news!</strong> Your support ticket has been successfully resolved.</p>
      </div>
      
      <h3>Ticket Details:</h3>
      <p><strong>Ticket ID:</strong> #{{id}}</p>
      <p><strong>Title:</strong> {{title}}</p>
      <p><strong>Room:</strong> {{room}}</p>
      <p><strong>IT Support:</strong> {{resolver}}</p>
      
      <p style="margin-top: 20px;">Please take a moment to rate our service:</p>
      <a href="{{link}}" 
         style="background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        ⭐ Rate Service
      </a>
      
      <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
        Thank you for using PSUIC Help Desk System
      </p>
    </div>
  </div>
</body>
</html>`,
        variables: JSON.stringify(['id', 'title', 'room', 'resolver', 'link']),
        isEnabled: true
    }
];

async function main() {
    console.log('Start seeding email templates...');

    for (const t of templates) {
        const upsert = await prisma.emailTemplate.upsert({
            where: { name: t.name },
            update: {}, // Don't overwrite if exists
            create: t,
        });
        console.log(`Upserted template: ${upsert.name}`);
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
