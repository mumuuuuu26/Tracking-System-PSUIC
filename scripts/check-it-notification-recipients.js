const { PrismaClient } = require("@prisma/client");
const dotenv = require("dotenv");

if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.production" });
} else {
  dotenv.config();
}

const prisma = new PrismaClient();
const EMAIL_ADDRESS_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function main() {
  const notificationUsers = await prisma.user.findMany({
    where: {
      OR: [{ role: "it_support" }, { role: "admin" }],
      enabled: true,
    },
    select: {
      id: true,
      role: true,
      email: true,
      isEmailEnabled: true,
      notificationEmail: true,
    },
    orderBy: { id: "asc" },
  });

  const recipients = [
    ...new Set(
      notificationUsers
        .filter(
          (u) =>
            u.role === "it_support" &&
            u.isEmailEnabled !== false &&
            typeof u.notificationEmail === "string" &&
            EMAIL_ADDRESS_REGEX.test(u.notificationEmail.trim())
        )
        .map((u) => u.notificationEmail.trim().toLowerCase())
    ),
  ];

  console.log("NOTIFICATION_USERS");
  console.table(notificationUsers);
  console.log("IT_EMAIL_RECIPIENTS");
  console.log(JSON.stringify(recipients, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
