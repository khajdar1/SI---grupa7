-- Align legacy enum values with current Prisma schema enums.
-- Priority: URGENT/NORMAL -> CRITICAL/MEDIUM
-- Intervention status: OPEN/DONE/CANCELED -> NEW/RESOLVED/CANCELLED

-- 1) Expand Intervention.priority to include old and new values during transition
ALTER TABLE `Intervention`
  MODIFY `priority` ENUM('URGENT','HIGH','NORMAL','LOW','CRITICAL','MEDIUM') NOT NULL DEFAULT 'NORMAL';

UPDATE `Intervention` SET `priority` = 'CRITICAL' WHERE `priority` = 'URGENT';
UPDATE `Intervention` SET `priority` = 'MEDIUM' WHERE `priority` = 'NORMAL';

ALTER TABLE `Intervention`
  MODIFY `priority` ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM';

-- 2) Expand SlaConfiguration.priority and normalize values
ALTER TABLE `SlaConfiguration`
  MODIFY `priority` ENUM('URGENT','HIGH','NORMAL','LOW','CRITICAL','MEDIUM') NOT NULL;

UPDATE `SlaConfiguration` SET `priority` = 'CRITICAL' WHERE `priority` = 'URGENT';
UPDATE `SlaConfiguration` SET `priority` = 'MEDIUM' WHERE `priority` = 'NORMAL';

ALTER TABLE `SlaConfiguration`
  MODIFY `priority` ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL;

-- 3) Expand Intervention.status to include old and new values
ALTER TABLE `Intervention`
  MODIFY `status` ENUM('OPEN','IN_PROGRESS','DONE','CANCELED','NEW','ASSIGNED','RESOLVED','CANCELLED','REJECTED') NOT NULL DEFAULT 'OPEN';

UPDATE `Intervention` SET `status` = 'NEW' WHERE `status` = 'OPEN';
UPDATE `Intervention` SET `status` = 'RESOLVED' WHERE `status` = 'DONE';
UPDATE `Intervention` SET `status` = 'CANCELLED' WHERE `status` = 'CANCELED';

ALTER TABLE `Intervention`
  MODIFY `status` ENUM('NEW','ASSIGNED','IN_PROGRESS','RESOLVED','CANCELLED','REJECTED') NOT NULL DEFAULT 'NEW';

-- 4) Align StatusHistory oldStatus/newStatus enum values
ALTER TABLE `StatusHistory`
  MODIFY `oldStatus` ENUM('OPEN','IN_PROGRESS','DONE','CANCELED','NEW','ASSIGNED','RESOLVED','CANCELLED','REJECTED') NOT NULL,
  MODIFY `newStatus` ENUM('OPEN','IN_PROGRESS','DONE','CANCELED','NEW','ASSIGNED','RESOLVED','CANCELLED','REJECTED') NOT NULL;

UPDATE `StatusHistory` SET `oldStatus` = 'NEW' WHERE `oldStatus` = 'OPEN';
UPDATE `StatusHistory` SET `oldStatus` = 'RESOLVED' WHERE `oldStatus` = 'DONE';
UPDATE `StatusHistory` SET `oldStatus` = 'CANCELLED' WHERE `oldStatus` = 'CANCELED';

UPDATE `StatusHistory` SET `newStatus` = 'NEW' WHERE `newStatus` = 'OPEN';
UPDATE `StatusHistory` SET `newStatus` = 'RESOLVED' WHERE `newStatus` = 'DONE';
UPDATE `StatusHistory` SET `newStatus` = 'CANCELLED' WHERE `newStatus` = 'CANCELED';

ALTER TABLE `StatusHistory`
  MODIFY `oldStatus` ENUM('NEW','ASSIGNED','IN_PROGRESS','RESOLVED','CANCELLED','REJECTED') NOT NULL,
  MODIFY `newStatus` ENUM('NEW','ASSIGNED','IN_PROGRESS','RESOLVED','CANCELLED','REJECTED') NOT NULL;
