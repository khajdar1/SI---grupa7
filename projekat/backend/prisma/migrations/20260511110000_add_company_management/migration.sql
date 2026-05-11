ALTER TABLE `Company`
  ADD COLUMN `email` VARCHAR(191) NULL,
  ADD COLUMN `phone` VARCHAR(191) NULL,
  ADD COLUMN `address` VARCHAR(191) NULL,
  ADD COLUMN `identificationNumber` VARCHAR(191) NULL,
  ADD COLUMN `status` ENUM('PENDING', 'ACTIVE', 'REJECTED', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN `adminUserId` INTEGER NULL;

CREATE UNIQUE INDEX `Company_email_key` ON `Company`(`email`);
CREATE UNIQUE INDEX `Company_identificationNumber_key` ON `Company`(`identificationNumber`);
CREATE UNIQUE INDEX `Company_adminUserId_key` ON `Company`(`adminUserId`);

ALTER TABLE `Company`
  ADD CONSTRAINT `Company_adminUserId_fkey`
  FOREIGN KEY (`adminUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
