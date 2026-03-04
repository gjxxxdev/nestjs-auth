-- CreateTable activity_claims
CREATE TABLE `activity_claims` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `activity` VARCHAR(50) NOT NULL,
    `claimed_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`),
    UNIQUE INDEX `uk_user_activity`(`user_id`, `activity`),
    INDEX `idx_user`(`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
