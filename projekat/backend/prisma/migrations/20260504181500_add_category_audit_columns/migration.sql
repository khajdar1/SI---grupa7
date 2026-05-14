-- Align Category table with the Prisma schema used by category administration.

ALTER TABLE `Category`
  ADD COLUMN `createdByName` VARCHAR(191) NULL,
  ADD COLUMN `updatedByName` VARCHAR(191) NULL;
