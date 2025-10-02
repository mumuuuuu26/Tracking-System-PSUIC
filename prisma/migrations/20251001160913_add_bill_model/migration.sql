-- DropForeignKey
ALTER TABLE `Bill` DROP FOREIGN KEY `Bill_categoryId_fkey`;

-- DropIndex
DROP INDEX `Bill_categoryId_fkey` ON `Bill`;

-- AlterTable
ALTER TABLE `Bill` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE `Bill` ADD CONSTRAINT `Bill_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
