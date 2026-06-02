-- PBI-052/PBI-053/PBI-062: feedback quality analytics, servicer absences,
-- and controlled intervention pauses.

ALTER TABLE `Intervention`
  MODIFY `status` ENUM('NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CANCELLED', 'REJECTED') NOT NULL DEFAULT 'NEW';

ALTER TABLE `StatusHistory`
  MODIFY `oldStatus` ENUM('NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CANCELLED', 'REJECTED') NOT NULL,
  MODIFY `newStatus` ENUM('NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CANCELLED', 'REJECTED') NOT NULL;

ALTER TABLE `Notification`
  MODIFY `type` ENUM(
    'NEW_REPORT',
    'INTERVENTION_ASSIGNED',
    'STATUS_CHANGED',
    'FEEDBACK_REQUEST',
    'AUTO_ASSIGNMENT',
    'NEW_TICKET',
    'TICKET_REPLY',
    'INTERVENTION_PAUSED',
    'EXECUTION_CONFIRMATION_REQUEST',
    'EXECUTION_CONFIRMATION_RESPONSE'
  ) NOT NULL;

CREATE TABLE `ServicerUnavailability` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `startAt` DATETIME(3) NOT NULL,
  `endAt` DATETIME(3) NOT NULL,
  `reason` VARCHAR(500) NOT NULL,
  `canceledAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `ServicerUnavailability_userId_startAt_endAt_idx`(`userId`, `startAt`, `endAt`),
  INDEX `ServicerUnavailability_canceledAt_idx`(`canceledAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `InterventionPause` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `interventionId` INTEGER NOT NULL,
  `pausedById` INTEGER NOT NULL,
  `responsibleUserId` INTEGER NULL,
  `reason` ENUM('WAITING_FOR_CUSTOMER', 'WAITING_FOR_MATERIAL', 'WAITING_FOR_EXTERNAL_CONTRACTOR', 'WAITING_FOR_APPROVAL', 'OTHER') NOT NULL,
  `otherReason` VARCHAR(1000) NULL,
  `previousStatus` ENUM('NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CANCELLED', 'REJECTED') NOT NULL,
  `pausedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `resumedAt` DATETIME(3) NULL,
  `resumedById` INTEGER NULL,
  `resumeNote` VARCHAR(1000) NULL,
  INDEX `InterventionPause_interventionId_resumedAt_idx`(`interventionId`, `resumedAt`),
  INDEX `InterventionPause_reason_idx`(`reason`),
  INDEX `InterventionPause_pausedAt_idx`(`pausedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ServicerUnavailability`
  ADD CONSTRAINT `ServicerUnavailability_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `InterventionPause`
  ADD CONSTRAINT `InterventionPause_interventionId_fkey`
  FOREIGN KEY (`interventionId`) REFERENCES `Intervention`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `InterventionPause_pausedById_fkey`
  FOREIGN KEY (`pausedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `InterventionPause_responsibleUserId_fkey`
  FOREIGN KEY (`responsibleUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
