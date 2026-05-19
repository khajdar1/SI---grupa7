CREATE TABLE `TicketCategory` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `TicketCategory_name_key`(`name`),
  INDEX `TicketCategory_active_name_idx`(`active`, `name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `TicketCategory` (`name`, `active`)
VALUES
  ('Tehničko pitanje', true),
  ('Prijava greške u aplikaciji', true),
  ('Ostalo', true)
ON DUPLICATE KEY UPDATE `active` = VALUES(`active`);

ALTER TABLE `Ticket` ADD COLUMN `categoryId` INTEGER NULL;

UPDATE `Ticket` ticket
INNER JOIN `TicketCategory` category ON category.`name` = ticket.`category`
SET ticket.`categoryId` = category.`id`;

UPDATE `Ticket` ticket
INNER JOIN `TicketCategory` category ON category.`name` = 'Ostalo'
SET ticket.`categoryId` = category.`id`
WHERE ticket.`categoryId` IS NULL;

ALTER TABLE `Ticket` MODIFY `categoryId` INTEGER NOT NULL;

CREATE INDEX `Ticket_categoryId_idx` ON `Ticket`(`categoryId`);

ALTER TABLE `Ticket`
  ADD CONSTRAINT `Ticket_categoryId_fkey`
  FOREIGN KEY (`categoryId`) REFERENCES `TicketCategory`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Ticket` DROP COLUMN `category`;
