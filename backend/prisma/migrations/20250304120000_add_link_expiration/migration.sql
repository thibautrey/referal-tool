-- Add optional expiration date to links
ALTER TABLE `Link`
    ADD COLUMN `expiresAt` DATETIME(3) NULL;

CREATE INDEX `Link_expiresAt_idx` ON `Link`(`expiresAt`);
