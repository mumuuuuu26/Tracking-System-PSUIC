const prisma = require('./config/prisma');

async function checkUserValue() {
    try {
        const itUser = await prisma.user.findFirst({
            where: { role: 'it_support' },
            select: { id: true, email: true, isEmailEnabled: true, notificationEmail: true }
        });

        console.log("IT User in DB:", itUser);
        console.log("isEmailEnabled Type:", typeof itUser.isEmailEnabled);
        console.log("isEmailEnabled Value:", itUser.isEmailEnabled);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUserValue();
