-- DropForeignKey
ALTER TABLE `DeviceRule` DROP FOREIGN KEY `DeviceRule_linkId_fkey`;

-- DropForeignKey
ALTER TABLE `Link` DROP FOREIGN KEY `Link_projectId_fkey`;

-- DropForeignKey
ALTER TABLE `LinkRule` DROP FOREIGN KEY `LinkRule_linkId_fkey`;

-- DropForeignKey
ALTER TABLE `LinkVisit` DROP FOREIGN KEY `LinkVisit_linkId_fkey`;

-- AddForeignKey
ALTER TABLE `Link` ADD CONSTRAINT `Link_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LinkRule` ADD CONSTRAINT `LinkRule_linkId_fkey` FOREIGN KEY (`linkId`) REFERENCES `Link`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeviceRule` ADD CONSTRAINT `DeviceRule_linkId_fkey` FOREIGN KEY (`linkId`) REFERENCES `Link`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LinkVisit` ADD CONSTRAINT `LinkVisit_linkId_fkey` FOREIGN KEY (`linkId`) REFERENCES `Link`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
