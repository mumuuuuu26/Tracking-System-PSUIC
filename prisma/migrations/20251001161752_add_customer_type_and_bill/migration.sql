/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Bill` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Bill` DROP FOREIGN KEY `Bill_categoryId_fkey`;

-- AlterTable
ALTER TABLE `Bill` DROP COLUMN `updatedAt`;

-- AddForeignKey
ALTER TABLE `Bill` ADD CONSTRAINT `Bill_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
