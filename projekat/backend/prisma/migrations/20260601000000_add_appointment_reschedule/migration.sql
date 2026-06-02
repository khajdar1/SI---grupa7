-- Add appointmentConfirmedAt column to Intervention
ALTER TABLE `Intervention`
  ADD COLUMN `appointmentConfirmedAt` DATETIME(3) NULL;

-- Update Notification type enum with new values
ALTER TABLE `Notification`
  MODIFY COLUMN `type` ENUM('NEW_REPORT', 'INTERVENTION_ASSIGNED', 'STATUS_CHANGED', 'FEEDBACK_REQUEST', 'AUTO_ASSIGNMENT', 'NEW_TICKET', 'TICKET_REPLY', 'INTERVENTION_PAUSED', 'SERVICER_DISPATCHED', 'SERVICER_ARRIVED', 'EXECUTION_CONFIRMATION_REQUEST', 'EXECUTION_CONFIRMATION_RESPONSE', 'INTERVENTION_SCHEDULED', 'APPOINTMENT_RESCHEDULE_REQUEST', 'APPOINTMENT_RESCHEDULE_RESPONSE') NOT NULL;

-- Create AppointmentRescheduleRequest table
CREATE TABLE IF NOT EXISTS `AppointmentRescheduleRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `interventionId` INTEGER NOT NULL,
    `requestedById` INTEGER NOT NULL,
    `proposedStartedAt` DATETIME(3) NOT NULL,
    `comment` VARCHAR(1000) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `respondedById` INTEGER NULL,
    `responseComment` VARCHAR(1000) NULL,
    `respondedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AppointmentRescheduleRequest_interventionId_idx`(`interventionId`),
    INDEX `AppointmentRescheduleRequest_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign keys
ALTER TABLE `AppointmentRescheduleRequest` ADD CONSTRAINT `AppointmentRescheduleRequest_interventionId_fkey` FOREIGN KEY (`interventionId`) REFERENCES `Intervention`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AppointmentRescheduleRequest` ADD CONSTRAINT `AppointmentRescheduleRequest_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AppointmentRescheduleRequest` ADD CONSTRAINT `AppointmentRescheduleRequest_respondedById_fkey` FOREIGN KEY (`respondedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
