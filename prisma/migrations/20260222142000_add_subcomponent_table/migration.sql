-- Add missing SubComponent table referenced by Category relations.
CREATE TABLE `SubComponent` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `categoryId` INTEGER NOT NULL,

  INDEX `SubComponent_categoryId_idx`(`categoryId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `SubComponent`
ADD CONSTRAINT `SubComponent_categoryId_fkey`
FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
