-- AddColumn remark to CoinLedger table
ALTER TABLE `coin_ledger` ADD COLUMN `remark` VARCHAR(255) NULL DEFAULT NULL;
