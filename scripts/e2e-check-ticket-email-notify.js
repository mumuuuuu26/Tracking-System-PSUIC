const axios = require("axios");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.production" });
} else {
  dotenv.config();
}

const prisma = new PrismaClient();

async function main() {
  const secret = String(process.env.SECRET || "").trim();
  if (!secret) {
    throw new Error("SECRET is missing");
  }

  const port = Number(process.env.PORT || 80);
  const baseUrl = `http://127.0.0.1:${port}`;

  const user = await prisma.user.findFirst({
    where: { role: "user", enabled: true },
    select: { id: true, email: true },
    orderBy: { id: "asc" },
  });

  if (!user) {
    throw new Error("No enabled user account found for E2E ticket creation");
  }

  const room = await prisma.room.findFirst({
    select: { id: true },
    orderBy: { id: "asc" },
  });

  if (!room) {
    throw new Error("No room found in database");
  }

  const category = await prisma.category.findFirst({
    select: { id: true },
    orderBy: { id: "asc" },
  });

  const token = jwt.sign({ id: user.id }, secret, { expiresIn: "10m" });
  const marker = `SMTP E2E ${Date.now()}`;

  const payload = {
    title: marker,
    description: `Automated E2E notification check for ${marker}`,
    urgency: "Low",
    roomId: room.id,
    categoryId: category?.id ?? null,
  };

  const response = await axios.post(`${baseUrl}/api/ticket`, payload, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 15000,
  });

  console.log(`CREATED_TICKET_ID=${response.data.id}`);
  console.log(`CREATED_TICKET_TITLE=${response.data.title}`);
}

main()
  .catch((error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data ||
      error.message ||
      String(error);
    console.error(`E2E_CHECK_FAILED: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
