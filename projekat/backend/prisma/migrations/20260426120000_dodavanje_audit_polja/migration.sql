-- AlterTable
ALTER TABLE `Category` ADD COLUMN `updatedById` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
