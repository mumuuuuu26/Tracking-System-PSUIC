jest.mock("../../config/prisma", () => ({
  emailTemplate: {
    findUnique: jest.fn(),
  },
}));

jest.mock("../../config/nodemailer", () => ({
  sendMail: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const prisma = require("../../config/prisma");
const transporter = require("../../config/nodemailer");
const { sendEmailNotification } = require("../../utils/sendEmailHelper");

describe("sendEmailNotification", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.EMAIL_SEND_IN_TEST = "true";
    process.env.MAIL_USER = "noreply@example.com";
    process.env.MAIL_PASS = "app-password";
    prisma.emailTemplate.findUnique.mockResolvedValue(null);
    transporter.sendMail.mockResolvedValue({ messageId: "ok" });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns missing_config when MAIL credentials are missing", async () => {
    delete process.env.MAIL_USER;
    delete process.env.MAIL_PASS;

    const result = await sendEmailNotification("new_ticket_it", "it@example.com", {
      title: "Printer issue",
    });

    expect(result).toEqual({ sent: false, reason: "missing_config" });
    expect(transporter.sendMail).not.toHaveBeenCalled();
  });

  it("sends email using fallback template when DB template is absent", async () => {
    const result = await sendEmailNotification("new_ticket_it", ["it@example.com"], {
      ticketId: 55,
      title: "Scanner broken",
      description: "Cannot scan",
      status: "not_start",
      urgency: "High",
      category: "Hardware",
      subComponent: "Scanner",
      room: "1210",
      floor: "12",
      building: "PSUIC",
      equipment: "Canon Scanner",
      equipmentType: "Scanner",
      reporterName: "User A",
      reporterEmail: "user@example.com",
      reporterPhone: "0800000000",
      createdAt: "26/02/2026 20:30",
      link: "http://example.com/it/ticket/55",
    });

    expect(result).toEqual({ sent: true });
    expect(transporter.sendMail).toHaveBeenCalledTimes(1);
    const payload = transporter.sendMail.mock.calls[0][0];
    expect(payload.to).toContain("it@example.com");
    expect(payload.subject).toContain("New Ticket #55");
    expect(payload.html).toContain("Scanner broken");
  });

  it("returns template_disabled when template exists but disabled", async () => {
    prisma.emailTemplate.findUnique.mockResolvedValue({
      name: "new_ticket_it",
      subject: "Disabled",
      body: "Disabled",
      isEnabled: false,
    });

    const result = await sendEmailNotification("new_ticket_it", "it@example.com", {
      title: "ignored",
    });

    expect(result).toEqual({ sent: false, reason: "template_disabled" });
    expect(transporter.sendMail).not.toHaveBeenCalled();
  });

  it("returns send_failed when transporter throws", async () => {
    transporter.sendMail.mockRejectedValue(new Error("SMTP auth failed"));

    const result = await sendEmailNotification("new_ticket_it", "it@example.com", {
      title: "LAN issue",
    });

    expect(result).toMatchObject({ sent: false, reason: "send_failed" });
  });
});
