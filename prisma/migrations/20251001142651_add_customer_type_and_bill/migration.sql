-- AlterTable
ALTER TABLE `Category` ADD COLUMN `customerType` VARCHAR(191) NOT NULL DEFAULT 'retail';

-- CreateTable
CREATE TABLE `Bill` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `plate` VARCHAR(191) NOT NULL,
    `categoryId` INTEGER NULL,
    `customerType` VARCHAR(191) NOT NULL,
    `weightIn` DOUBLE NOT NULL,
    `weightOut` DOUBLE NOT NULL,
    `netWeight` DOUBLE NOT NULL,
    `pricePerKg` DOUBLE NOT NULL,
    `amount` DOUBLE NOT NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Bill_categoryId_fkey`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Bill` ADD CONSTRAINT `Bill_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
