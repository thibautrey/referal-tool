/*
  Warnings:

  - A unique constraint covering the columns `[shortCode]` on the table `Link` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shortCode` to the `Link` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Link` ADD COLUMN `shortCode` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Link_shortCode_key` ON `Link`(`shortCode`);
