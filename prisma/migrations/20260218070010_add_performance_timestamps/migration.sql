-- AlterTable
ALTER TABLE `Ticket` ADD COLUMN `acceptedAt` DATETIME(3) NULL,
    ADD COLUMN `completedAt` DATETIME(3) NULL;
