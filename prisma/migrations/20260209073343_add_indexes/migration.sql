/*
  Warnings:

  - You are about to drop the column `rejectedAt` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedReason` on the `Ticket` table. All the data in the column will be lost.
  - You are about to drop the `Appointment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ITAvailability` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Appointment` DROP FOREIGN KEY `Appointment_itSupportId_fkey`;

-- DropForeignKey
ALTER TABLE `Appointment` DROP FOREIGN KEY `Appointment_ticketId_fkey`;

-- DropForeignKey
ALTER TABLE `ITAvailability` DROP FOREIGN KEY `ITAvailability_userId_fkey`;

-- AlterTable
ALTER TABLE `Room` MODIFY `imageUrl` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `Ticket` DROP COLUMN `rejectedAt`,
    DROP COLUMN `rejectedReason`,
    ADD COLUMN `checklist` TEXT NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `note` TEXT NULL,
    ADD COLUMN `susDetails` TEXT NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'not_start';

-- AlterTable
ALTER TABLE `User` ADD COLUMN `googleCalendarId` VARCHAR(191) NULL,
    ADD COLUMN `isEmailEnabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notificationEmail` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `Appointment`;

-- DropTable
DROP TABLE `ITAvailability`;

-- CreateTable
CREATE TABLE `PersonalTask` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `date` DATETIME(3) NOT NULL,
    `startTime` DATETIME(3) NULL,
    `endTime` DATETIME(3) NULL,
    `color` VARCHAR(191) NULL DEFAULT '#3B82F6',
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `variables` VARCHAR(191) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmailTemplate_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuickFix` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `image` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `views` INTEGER NOT NULL DEFAULT 0,
    `createdBy` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role` VARCHAR(191) NOT NULL,
    `viewTickets` BOOLEAN NOT NULL DEFAULT false,
    `editTickets` BOOLEAN NOT NULL DEFAULT false,
    `assignIT` BOOLEAN NOT NULL DEFAULT false,
    `manageUsers` BOOLEAN NOT NULL DEFAULT false,
    `manageEquipment` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RolePermission_role_key`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Ticket_status_idx` ON `Ticket`(`status`);

-- CreateIndex
CREATE INDEX `Ticket_isDeleted_idx` ON `Ticket`(`isDeleted`);

-- CreateIndex
CREATE INDEX `Ticket_status_createdAt_idx` ON `Ticket`(`status`, `createdAt`);

-- AddForeignKey
ALTER TABLE `PersonalTask` ADD CONSTRAINT `PersonalTask_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Ticket` RENAME INDEX `Ticket_assignedToId_fkey` TO `Ticket_assignedToId_idx`;

-- RenameIndex
ALTER TABLE `Ticket` RENAME INDEX `Ticket_createdById_fkey` TO `Ticket_createdById_idx`;

-- RenameIndex
ALTER TABLE `Ticket` RENAME INDEX `Ticket_equipmentId_fkey` TO `Ticket_equipmentId_idx`;

-- RenameIndex
ALTER TABLE `Ticket` RENAME INDEX `Ticket_roomId_fkey` TO `Ticket_roomId_idx`;
