-- AlterTable
ALTER TABLE `LinkVisit` ADD COLUMN `deviceRuleId` INTEGER NULL,
    ADD COLUMN `deviceType` VARCHAR(191) NULL,
    ADD COLUMN `userAgent` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `DeviceRule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `redirectUrl` VARCHAR(191) NOT NULL,
    `deviceType` VARCHAR(191) NOT NULL,
    `devices` VARCHAR(191) NOT NULL,
    `linkId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DeviceRule_linkId_idx`(`linkId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `LinkVisit_deviceRuleId_idx` ON `LinkVisit`(`deviceRuleId`);

-- AddForeignKey
ALTER TABLE `DeviceRule` ADD CONSTRAINT `DeviceRule_linkId_fkey` FOREIGN KEY (`linkId`) REFERENCES `Link`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LinkVisit` ADD CONSTRAINT `LinkVisit_deviceRuleId_fkey` FOREIGN KEY (`deviceRuleId`) REFERENCES `DeviceRule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
