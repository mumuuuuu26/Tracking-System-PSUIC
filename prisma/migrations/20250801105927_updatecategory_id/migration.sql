-- AlterTable
ALTER TABLE `Product` ADD COLUMN `categoryId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Product_categoryId_fkey` ON `Product`(`categoryId`);

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
