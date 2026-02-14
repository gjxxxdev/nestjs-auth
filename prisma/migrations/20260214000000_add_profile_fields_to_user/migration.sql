/*
  Warnings:

  - You are about to drop the column `createdAt` on the `User` table. All the data in that column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in that column will be lost.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `birth_date` DATETIME(3) NULL,
ADD COLUMN `gender` INT NOT NULL DEFAULT 0,
ADD COLUMN `role_level` INT NOT NULL DEFAULT 1,
MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);
