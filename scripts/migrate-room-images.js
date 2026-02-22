require("../config/env");
const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");
const { saveImage } = require("../utils/uploadImage");

const isBase64Image = (value) =>
  typeof value === "string" && value.trim().startsWith("data:image/");

const migrateRoomImages = async () => {
  const rooms = await prisma.room.findMany({
    select: {
      id: true,
      roomNumber: true,
      imageUrl: true,
    },
  });

  const targets = rooms.filter((room) => isBase64Image(room.imageUrl));
  logger.info(`[RoomImageMigration] Found ${targets.length} room image(s) to migrate.`);

  let migrated = 0;
  let failed = 0;

  for (const room of targets) {
    const savedUrl = await saveImage(room.imageUrl, { scope: "room-image-migration" });
    if (!savedUrl) {
      failed += 1;
      logger.warn(
        `[RoomImageMigration] Failed room #${room.id} (${room.roomNumber || "N/A"}): invalid image payload`,
      );
      continue;
    }

    await prisma.room.update({
      where: { id: room.id },
      data: { imageUrl: savedUrl },
    });

    migrated += 1;
    logger.info(`[RoomImageMigration] Migrated room #${room.id} -> ${savedUrl}`);
  }

  logger.info(`[RoomImageMigration] Completed. migrated=${migrated} failed=${failed}`);
  if (failed > 0) {
    process.exitCode = 1;
  }
};

const main = async () => {
  try {
    await migrateRoomImages();
  } catch (error) {
    logger.error(`[RoomImageMigration] Failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
};

main();
