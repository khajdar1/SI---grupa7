-- CreateTable
CREATE TABLE `InterventionEscalation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `interventionId` INTEGER NOT NULL,
    `escalatedById` INTEGER NOT NULL,
    `reason` VARCHAR(1000) NOT NULL,
    `comment` LONGTEXT NOT NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InterventionEscalation_interventionId_idx`(`interventionId`),
    INDEX `InterventionEscalation_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InterventionEscalation` ADD CONSTRAINT `InterventionEscalation_interventionId_fkey` FOREIGN KEY (`interventionId`) REFERENCES `Intervention`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InterventionEscalation` ADD CONSTRAINT `InterventionEscalation_escalatedById_fkey` FOREIGN KEY (`escalatedById`) REFERENCES `User`(`id`) ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InterventionEscalation` ADD CONSTRAINT `InterventionEscalation_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
