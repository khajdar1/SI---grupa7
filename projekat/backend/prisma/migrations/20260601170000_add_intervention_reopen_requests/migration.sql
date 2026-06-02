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
    'SERVICER_DISPATCHED',
    'SERVICER_ARRIVED',
    'EXECUTION_CONFIRMATION_REQUEST',
    'EXECUTION_CONFIRMATION_RESPONSE',
    'REOPEN_REQUEST',
    'REOPEN_APPROVED',
    'REOPEN_REJECTED'
  ) NOT NULL;

CREATE TABLE `InterventionReopenRequest` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `interventionId` INTEGER NOT NULL,
  `requesterId` INTEGER NOT NULL,
  `reason` LONGTEXT NOT NULL,
  `comment` LONGTEXT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `coordinatorComment` LONGTEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `resolvedAt` DATETIME(3) NULL,

  INDEX `InterventionReopenRequest_interventionId_idx`(`interventionId`),
  INDEX `InterventionReopenRequest_requesterId_idx`(`requesterId`),
  INDEX `InterventionReopenRequest_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `InterventionReopenRequest`
  ADD CONSTRAINT `InterventionReopenRequest_interventionId_fkey`
  FOREIGN KEY (`interventionId`) REFERENCES `Intervention`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `InterventionReopenRequest_requesterId_fkey`
  FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
