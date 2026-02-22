-- Add missing subComponent column used by Ticket model and controllers.
ALTER TABLE `Ticket`
ADD COLUMN `subComponent` VARCHAR(255) NULL;
