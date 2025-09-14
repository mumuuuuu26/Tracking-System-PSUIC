-- CreateTable
CREATE TABLE `PalmPriceDaily` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL,
    `priceMin` DOUBLE NOT NULL,
    `priceAvg` DOUBLE NOT NULL,
    `priceMax` DOUBLE NOT NULL,
    `sourceName` VARCHAR(191) NOT NULL,
    `sourceUrl` VARCHAR(191) NOT NULL,
    `fetchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `note` VARCHAR(191) NULL,

    UNIQUE INDEX `PalmPriceDaily_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
