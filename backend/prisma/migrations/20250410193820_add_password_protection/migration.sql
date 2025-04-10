-- AlterTable
ALTER TABLE `Link` ADD COLUMN `isPasswordProtected` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `passwordHash` VARCHAR(191) NULL;
