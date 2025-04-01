-- CreateTable
CREATE TABLE `IpCountryCache` (
    `ip` VARCHAR(191) NOT NULL,
    `countryCode` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`ip`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LinkVisit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `linkId` INTEGER NOT NULL,
    `ip` VARCHAR(191) NULL,
    `country` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NULL,
    `ruleId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LinkVisit_linkId_idx`(`linkId`),
    INDEX `LinkVisit_ip_idx`(`ip`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LinkVisit` ADD CONSTRAINT `LinkVisit_linkId_fkey` FOREIGN KEY (`linkId`) REFERENCES `Link`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LinkVisit` ADD CONSTRAINT `LinkVisit_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `LinkRule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
