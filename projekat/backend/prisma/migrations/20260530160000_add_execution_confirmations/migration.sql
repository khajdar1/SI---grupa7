CREATE TABLE `ExecutionConfirmation` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `interventionId` INTEGER NOT NULL,
  `requestedById` INTEGER NULL,
  `confirmedById` INTEGER NULL,
  `status` ENUM('NOT_REQUESTED', 'PENDING', 'CONFIRMED', 'REJECTED', 'CLOSED_WITHOUT_CONFIRMATION') NOT NULL DEFAULT 'PENDING',
  `method` ENUM('PIN', 'SIGNATURE', 'NONE') NULL,
  `pinHash` VARCHAR(191) NULL,
  `signatureData` LONGTEXT NULL,
  `rejectionReason` LONGTEXT NULL,
  `bypassReason` LONGTEXT NULL,
  `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `respondedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `ExecutionConfirmation_interventionId_key`(`interventionId`),
  INDEX `ExecutionConfirmation_status_idx`(`status`),
  INDEX `ExecutionConfirmation_requestedById_idx`(`requestedById`),
  INDEX `ExecutionConfirmation_confirmedById_idx`(`confirmedById`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ExecutionConfirmation`
  ADD CONSTRAINT `ExecutionConfirmation_interventionId_fkey`
  FOREIGN KEY (`interventionId`) REFERENCES `Intervention`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ExecutionConfirmation`
  ADD CONSTRAINT `ExecutionConfirmation_requestedById_fkey`
  FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ExecutionConfirmation`
  ADD CONSTRAINT `ExecutionConfirmation_confirmedById_fkey`
  FOREIGN KEY (`confirmedById`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
