/*
  Warnings:

  - You are about to drop the column `refunded_at` on the `iap_receipts` table. All the data in the column will be lost.
  - You are about to drop the column `revoked_at` on the `iap_receipts` table. All the data in the column will be lost.
  - You are about to drop the `webhook_events` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX `idx_iap_status` ON `iap_receipts`;

-- DropIndex
DROP INDEX `idx_iap_user_id` ON `iap_receipts`;

-- AlterTable
ALTER TABLE `iap_receipts` DROP COLUMN `refunded_at`,
    DROP COLUMN `revoked_at`,
    ALTER COLUMN `status` DROP DEFAULT;

-- DropTable
DROP TABLE `webhook_events`;
