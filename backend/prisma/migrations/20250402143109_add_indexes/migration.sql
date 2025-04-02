-- CreateIndex
CREATE INDEX `IpCountryCache_expiresAt_idx` ON `IpCountryCache`(`expiresAt`);

-- RenameIndex
ALTER TABLE `Link` RENAME INDEX `Link_projectId_fkey` TO `Link_projectId_idx`;

-- RenameIndex
ALTER TABLE `LinkRule` RENAME INDEX `LinkRule_linkId_fkey` TO `LinkRule_linkId_idx`;

-- RenameIndex
ALTER TABLE `LinkVisit` RENAME INDEX `LinkVisit_ruleId_fkey` TO `LinkVisit_ruleId_idx`;

-- RenameIndex
ALTER TABLE `Project` RENAME INDEX `Project_userId_fkey` TO `Project_userId_idx`;
