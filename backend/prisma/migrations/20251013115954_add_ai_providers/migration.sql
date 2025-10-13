-- AlterTable
ALTER TABLE `ApiKey` ADD COLUMN `primaryAiModelId` INTEGER NULL,
    ADD COLUMN `primaryAiProviderId` INTEGER NULL;

-- CreateTable
CREATE TABLE `AiProvider` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `baseUrl` VARCHAR(191) NULL,
    `inputTokenPrice` DECIMAL(18, 8) NULL,
    `outputTokenPrice` DECIMAL(18, 8) NULL,
    `fallbackProviderId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AiProvider_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiModel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `modelIdentifier` VARCHAR(191) NULL,
    `baseUrl` VARCHAR(191) NULL,
    `inputTokenPrice` DECIMAL(18, 8) NULL,
    `outputTokenPrice` DECIMAL(18, 8) NULL,
    `providerId` INTEGER NOT NULL,
    `fallbackModelId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ApiKey` ADD CONSTRAINT `ApiKey_primaryAiProviderId_fkey` FOREIGN KEY (`primaryAiProviderId`) REFERENCES `AiProvider`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApiKey` ADD CONSTRAINT `ApiKey_primaryAiModelId_fkey` FOREIGN KEY (`primaryAiModelId`) REFERENCES `AiModel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiProvider` ADD CONSTRAINT `AiProvider_fallbackProviderId_fkey` FOREIGN KEY (`fallbackProviderId`) REFERENCES `AiProvider`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiModel` ADD CONSTRAINT `AiModel_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `AiProvider`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiModel` ADD CONSTRAINT `AiModel_fallbackModelId_fkey` FOREIGN KEY (`fallbackModelId`) REFERENCES `AiModel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
