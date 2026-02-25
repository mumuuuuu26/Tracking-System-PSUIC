const prisma = require("../config/prisma");
const transporter = require("../config/nodemailer");
const { logger } = require("./logger");

const fallbackTemplates = {
    new_ticket_it: {
        subject: "New Ticket #{{ticketId}}: {{title}}",
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
        isEnabled: true,
    },
    ticket_rejected: {
        subject: "Ticket Rejected: {{title}}",
        body: "Your ticket <b>{{title}}</b> has been rejected. Reason: {{reason}}",
        isEnabled: true,
    },
    ticket_resolved_user: {
        subject: "Ticket Resolved: {{title}}",
        body: "Your ticket has been resolved by {{resolver}}. Room: {{room}}.<br><br><a href=\"{{link}}\">Click here to rate us</a>",
        isEnabled: true,
    },
    ticket_feedback_it: {
        subject: "Feedback Received: {{title}}",
        body: "User <b>{{rater}}</b> has accepted and rated ticket #{{ticketId}}.<br><br><b>Rating:</b> {{rating}} / 100<br><b>Feedback:</b> {{comments}}<br><br><a href=\"{{link}}\">View Ticket</a>",
        isEnabled: true,
    },
};

const replaceTemplateVariables = (content, variables) => {
    let rendered = content;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, "g");
        const safeValue = value === undefined || value === null ? "" : String(value);
        rendered = rendered.replace(regex, safeValue);
    }
    return rendered;
};

/**
 * Send email using a database template
 * @param {string} templateName - The unique name of the template (e.g., 'new_ticket_it')
 * @param {string|string[]} recipientEmail - Single email or array of emails
 * @param {object} variables - Key-value pairs to replace in subject/body (e.g. { title: '...', id: 1 })
 */
exports.sendEmailNotification = async (templateName, recipientEmail, variables) => {
    try {
        if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
            logger.warn("⚠️ Email config missing, skipping notification");
            return;
        }

        const dbTemplate = await prisma.emailTemplate.findUnique({
            where: { name: templateName }
        });
        const fallbackTemplate = fallbackTemplates[templateName] || null;
        const template = dbTemplate || fallbackTemplate;

        if (!template) {
            logger.warn(`⚠️ Template '${templateName}' not found in database.`);
            return;
        }

        if (!dbTemplate && fallbackTemplate) {
            logger.warn(
                `⚠️ Template '${templateName}' not found in database. Using fallback template.`,
            );
        }

        if (!template.isEnabled) {
            logger.info(`ℹ️ Notification '${templateName}' is disabled. Skipping.`);
            return;
        }

        const safeVariables = variables || {};
        const enrichedVariables = {
            ...safeVariables,
            // Keep backward-compat with old template keys.
            reporter: safeVariables.reporter || safeVariables.createdBy || "",
            createdBy: safeVariables.createdBy || safeVariables.reporter || "",
        };

        const subject = replaceTemplateVariables(template.subject, enrichedVariables);
        const html = replaceTemplateVariables(template.body, enrichedVariables);

        const to = Array.isArray(recipientEmail) ? recipientEmail.join(", ") : recipientEmail;

        if (!to) {
            logger.warn("⚠️ No recipients defined for email.");
            return;
        }

        const mailOptions = {
            from: `"PSUIC Help Desk" <${process.env.MAIL_USER}>`,
            to: to,
            subject: subject,
            html: html
        };

        await transporter.sendMail(mailOptions);
        logger.info(`✅ Email Sent: '${templateName}' to ${to.length > 50 ? to.substring(0, 50) + '...' : to}`);

    } catch (err) {
        logger.error(`❌ Email Helper Error: ${err.message}`);
    }
};
