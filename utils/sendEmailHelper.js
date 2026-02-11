const prisma = require("../config/prisma");
const transporter = require("../config/nodemailer");
const { logger } = require("./logger");

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

        // Fetch template
        const template = await prisma.emailTemplate.findUnique({
            where: { name: templateName }
        });

        if (!template) {
            logger.warn(`⚠️ Template '${templateName}' not found in database.`);
            return;
        }

        if (!template.isEnabled) {
            logger.info(`ℹ️ Notification '${templateName}' is disabled. Skipping.`);
            return;
        }

        let subject = template.subject;
        let html = template.body;

        // Replace variables
        // We handle {{key}} replacement safely
        for (const [key, value] of Object.entries(variables)) {
            // Regex to replace all occurrences case-insensitive? usually variables are case sensitive in mustache but let's be strict
            const regex = new RegExp(`{{${key}}}`, 'g');
            const safeValue = value === undefined || value === null ? '' : String(value);
            subject = subject.replace(regex, safeValue);
            html = html.replace(regex, safeValue);
        }

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
