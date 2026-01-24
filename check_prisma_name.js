const prisma = require('./config/prisma');

async function check() {
  try {
    console.log("Checking ITAvailability access...");
    // Try to access the model property. If it doesn't exist, this might throw or return undefined.
    // Common mappings: ITAvailability -> iTAvailability, itAvailability
    
    if (prisma.iTAvailability) {
        console.log("prisma.iTAvailability exists.");
    } else if (prisma.itAvailability) {
        console.log("prisma.itAvailability exists.");
    } else if (prisma.ITAvailability) {
        console.log("prisma.ITAvailability exists.");
    } else {
        console.log("Could not find ITAvailability model on prisma client.");
        console.log("Available keys:", Object.keys(prisma));
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
