ALTER TABLE `Report`
  ADD COLUMN `isRecommended` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `recommendedAt` DATETIME(3) NULL,
  ADD COLUMN `recommendedById` INTEGER NULL;

CREATE INDEX `Report_isRecommended_idx` ON `Report`(`isRecommended`);

ALTER TABLE `Report`
  ADD CONSTRAINT `Report_recommendedById_fkey`
  FOREIGN KEY (`recommendedById`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
