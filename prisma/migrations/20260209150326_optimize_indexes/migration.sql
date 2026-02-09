-- CreateIndex
CREATE INDEX `Ticket_urgency_idx` ON `Ticket`(`urgency`);

-- CreateIndex
CREATE INDEX `Ticket_updatedAt_idx` ON `Ticket`(`updatedAt`);

-- CreateIndex
CREATE INDEX `Ticket_assignedToId_status_idx` ON `Ticket`(`assignedToId`, `status`);

-- RenameIndex
ALTER TABLE `Ticket` RENAME INDEX `Ticket_categoryId_fkey` TO `Ticket_categoryId_idx`;
