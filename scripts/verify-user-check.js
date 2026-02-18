const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function test() {
    const testEmail = "test-not-found@psu.ac.th";
    const existingEmail = "user@psu.ac.th"; // From seed-complete.js

    console.log("--- Starting Verification Script ---");

    // 1. Test for non-existent user
    console.log(`Checking if ${testEmail} exists...`);
    const user1 = await prisma.user.findFirst({ where: { email: testEmail } });
    if (!user1) {
        console.log("✅ Correct: User not found in database.");
    } else {
        console.log("❌ Error: User found but should not be there.");
    }

    // 2. Test for existing user
    console.log(`Checking if ${existingEmail} exists...`);
    const user2 = await prisma.user.findFirst({ where: { email: existingEmail } });
    if (user2) {
        console.log(`✅ Correct: User found (Role: ${user2.role}).`);
        
        // Simulate "Add User" (Update Role)
        const updatedUser = await prisma.user.update({
            where: { id: user2.id },
            data: { role: 'it_support' }
        });
        console.log(`✅ Success: User role updated to ${updatedUser.role}.`);

        // Revert role
        await prisma.user.update({
            where: { id: user2.id },
            data: { role: user2.role }
        });
        console.log("✅ Rolled back role change.");
    } else {
        console.log("❌ Error: Existing user was not found.");
    }

    console.log("--- Verification Script Finished ---");
}

test()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
