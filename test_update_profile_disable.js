const prisma = require('./config/prisma');

async function testUpdateProfileDisable() {
    try {
        const itUser = await prisma.user.findFirst({
            where: { role: 'it_support' }
        });

        if (!itUser) {
            console.log("No IT user found");
            return;
        }

        console.log("Original User Before:", itUser.isEmailEnabled);

        // Simulate sending FALSE
        const reqBody = {
            isEmailEnabled: false,
            // Note: notificationEmail left out or whatever
        };

        const { email, phoneNumber, department, name, username, isEmailEnabled, notificationEmail } = reqBody;

        const updateData = {
            email,
            phoneNumber,
            department,
            name,
            username
        };

        if (typeof isEmailEnabled !== 'undefined') updateData.isEmailEnabled = isEmailEnabled;
        if (typeof notificationEmail !== 'undefined') updateData.notificationEmail = notificationEmail;

        console.log("Constructed updateData:", updateData);

        const updatedUser = await prisma.user.update({
            where: { id: itUser.id },
            data: updateData,
            select: { email: true, notificationEmail: true, isEmailEnabled: true }
        });

        console.log("Result from DB:", updatedUser);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

testUpdateProfileDisable();
