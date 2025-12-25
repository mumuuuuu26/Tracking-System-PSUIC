/*
  Warnings:

  - You are about to drop the `KnowledgeBase` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE `Appointment` ADD COLUMN `googleEventId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Ticket` ADD COLUMN `categoryId` INTEGER NULL,
    ADD COLUMN `rating` INTEGER NULL,
    ADD COLUMN `userFeedback` TEXT NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'Draft';

-- DropTable
DROP TABLE `KnowledgeBase`;

-- CreateTable
CREATE TABLE `Category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Category_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ITAvailability` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `startTime` DATETIME(3) NULL,
    `endTime` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ITAvailability` ADD CONSTRAINT `ITAvailability_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
