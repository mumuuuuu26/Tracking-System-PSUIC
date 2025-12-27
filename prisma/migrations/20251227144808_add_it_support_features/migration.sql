/*
  Warnings:

  - You are about to drop the column `updatedBy` on the `ActivityLog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ActivityLog` DROP COLUMN `updatedBy`,
    ADD COLUMN `updatedById` INTEGER NULL;

-- AlterTable
ALTER TABLE `Ticket` ADD COLUMN `notifiedAt` DATETIME(3) NULL,
    ADD COLUMN `readAt` DATETIME(3) NULL,
    ADD COLUMN `rejectedAt` DATETIME(3) NULL,
    ADD COLUMN `rejectedReason` TEXT NULL,
    ADD COLUMN `resolutionTime` INTEGER NULL,
    ADD COLUMN `responseTime` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `avgRating` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `department` VARCHAR(191) NULL,
    ADD COLUMN `lineId` VARCHAR(191) NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NULL,
    ADD COLUMN `totalRated` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `totalResolved` INTEGER NOT NULL DEFAULT 0,
    MODIFY `picture` LONGTEXT NULL;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `ticketId` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `Ticket`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityLog` ADD CONSTRAINT `ActivityLog_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
