const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Knowledge Base...');

    await prisma.knowledgeBase.deleteMany({}); // Clear existing data

    const kbItems = [
        {
            title: 'How to Reset Your Password',
            content: 'If you forget your password, you can reset it by clicking on the "Forgot Password" link on the login page. Follow the instructions sent to your email.',
            category: 'FAQ',
            tags: 'password, account, login',
            viewCount: 150,
            helpful: 45,
            isPublished: true,
        },
        {
            title: 'Connecting to PSU WiFi',
            content: 'To connect to the PSU WiFi network, select "PSU-WiFi" from your device\'s network list. Enter your university username and password when prompted.',
            category: 'Article',
            tags: 'wifi, internet, network',
            imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bbcbf?auto=format&fit=crop&q=80&w=1000',
            viewCount: 320,
            helpful: 89,
            isPublished: true,
        },
        {
            title: 'Troubleshooting Printer Issues',
            content: 'Common printer issues can often be resolved by checking paper rays, toner levels, and network connection. This video guides you through the basic steps.',
            category: 'Video',
            tags: 'printer, hardware, fix',
            videoUrl: 'https://www.youtube.com/watch?v=1234567890', // Dummy URL
            imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&q=80&w=1000',
            viewCount: 50,
            helpful: 12,
            isPublished: true,
        },
        {
            title: 'VPN Setup Guide',
            content: 'Access internal university resources from home using our VPN. Download the client from the IT portal and configure it with the settings provided in this guide.',
            category: 'Article',
            tags: 'vpn, remote access, security',
            viewCount: 200,
            helpful: 67,
            isPublished: true,
        },
        {
            title: 'Email Configuration for Mobile',
            content: 'Learn how to set up your university email on iOS and Android devices. Support for Outlook and native mail apps.',
            category: 'Article',
            tags: 'email, mobile, ios, android',
            viewCount: 180,
            helpful: 55,
            isPublished: true,
        }
    ];

    for (const item of kbItems) {
        await prisma.knowledgeBase.create({
            data: item
        });
    }

    console.log('Knowledge Base seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
