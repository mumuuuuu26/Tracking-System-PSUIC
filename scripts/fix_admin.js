const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Fixing admin user role...");

    const adminEmail = "admin@psu.ac.th";

    const admin = await prisma.user.findFirst({
        where: { email: adminEmail },
    });

    if (!admin) {
        console.log("Admin user not found!");
        return;
    }

    console.log(`Found user: ${admin.email}, Current role: ${admin.role}`);

    const updatedAdmin = await prisma.user.update({
        where: { id: admin.id },
        data: {
            role: "admin",
            enabled: true // Ensure account is enabled
        },
    });

    console.log(`Updated user: ${updatedAdmin.email}, New role: ${updatedAdmin.role}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
