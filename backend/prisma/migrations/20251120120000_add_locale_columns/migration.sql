-- AlterTable
ALTER TABLE `User`
    ADD COLUMN `locale` VARCHAR(191) NULL DEFAULT 'en';

ALTER TABLE `Project`
    ADD COLUMN `locale` VARCHAR(191) NULL DEFAULT 'en';
