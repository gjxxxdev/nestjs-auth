/*
  Warnings:

  - You are about to alter the column `createdAt` on the `User` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.
  - You are about to alter the column `updatedAt` on the `User` table. The data in that column could be lost. The data in that column will be cast from `DateTime(3)` to `DateTime(0)`.

*/
-- AlterTable
ALTER TABLE `User` MODIFY `email` VARCHAR(255) NOT NULL,
    MODIFY `password` VARCHAR(255) NOT NULL,
    MODIFY `name` VARCHAR(255) NULL,
    MODIFY `provider` VARCHAR(255) NULL,
    MODIFY `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `providerId` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `StoryLists` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `order` VARCHAR(255) NULL,
    `main_menu_name` VARCHAR(255) NULL,
    `main_menu_name_size` INTEGER NULL,
    `main_menu_name_weight` VARCHAR(255) NULL,
    `main_menu_name_color` VARCHAR(255) NULL,
    `main_menu_image` VARCHAR(255) NULL,
    `main_menu_title` VARCHAR(255) NULL,
    `main_menu_content` TEXT NULL,
    `main_menu_btn_left` VARCHAR(255) NULL,
    `main_menu_btn_right` VARCHAR(255) NULL,
    `stroy_name` VARCHAR(255) NULL,
    `author` VARCHAR(255) NULL,
    `story_type` VARCHAR(255) NULL,
    `price` VARCHAR(255) NULL,
    `chapter_type` VARCHAR(255) NULL,
    `open` VARCHAR(255) NULL,
    `view_times` VARCHAR(255) NULL,
    `buy_times` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_store_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `storyListId` INTEGER NOT NULL,
    `priceCoins` INTEGER NOT NULL DEFAULT 100,
    `currency` VARCHAR(20) NOT NULL DEFAULT 'COIN',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `soldCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_book_store_items_story_list`(`storyListId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coin_ledger` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `change_amount` INTEGER NOT NULL,
    `balance` INTEGER NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `source` VARCHAR(50) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iap_receipts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `platform` VARCHAR(20) NOT NULL,
    `product_id` VARCHAR(100) NOT NULL,
    `transaction_id` VARCHAR(100) NOT NULL,
    `coins` INTEGER NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    `raw_response` JSON NULL,
    `revoked_at` DATETIME(0) NULL,
    `refunded_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_iap_user_id`(`user_id`),
    INDEX `idx_iap_status`(`status`),
    UNIQUE INDEX `uniq_receipt`(`platform`, `transaction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_events` (
    `id` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(20) NOT NULL,
    `event_id` VARCHAR(255) NOT NULL,
    `event_type` VARCHAR(50) NOT NULL,
    `user_id` INTEGER NULL,
    `transaction_id` VARCHAR(100) NULL,
    `payload` JSON NOT NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `processed_at` DATETIME(0) NULL,
    `error` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_webhook_pending`(`processed`, `created_at`),
    INDEX `idx_webhook_user`(`user_id`),
    UNIQUE INDEX `uniq_webhook_event`(`platform`, `event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Abouts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `about_content` TEXT NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChapterFoolproofs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `chapter_foolproof_story_name_size` INTEGER NULL,
    `chapter_foolproof_story_name_weight` VARCHAR(255) NULL,
    `chapter_foolproof_story_name_color` VARCHAR(255) NULL,
    `chapter_foolproof_stroy_information_size` INTEGER NULL,
    `chapter_foolproof_stroy_information_weight` VARCHAR(255) NULL,
    `chapter_foolproof_stroy_information_color` VARCHAR(255) NULL,
    `chapter_foolproof_stroy_item1_size` INTEGER NULL,
    `chapter_foolproof_stroy_item1_weight` VARCHAR(255) NULL,
    `chapter_foolproof_stroy_item1_color` VARCHAR(255) NULL,
    `chapter_foolproof_stroy_item2_size` INTEGER NULL,
    `chapter_foolproof_stroy_item2_weight` VARCHAR(255) NULL,
    `chapter_foolproof_stroy_item2_color` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Chapters` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `storyid` INTEGER NULL,
    `order` VARCHAR(255) NULL,
    `chapter_name` VARCHAR(255) NULL,
    `chapter_name_size` INTEGER NULL,
    `chapter_name_weight` VARCHAR(255) NULL,
    `chapter_name_color` VARCHAR(255) NULL,
    `chapter_infor` TEXT NULL,
    `chapter_img` VARCHAR(255) NULL,
    `window_title` VARCHAR(255) NULL,
    `window_btn_left` VARCHAR(255) NULL,
    `window_btn_right` VARCHAR(255) NULL,
    `free_open` VARCHAR(255) NULL,
    `read_range_end` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MainMenuFoolproofs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `menu_foolproof_story_name_size` INTEGER NULL,
    `menu_foolproof_story_name_weight` VARCHAR(255) NULL,
    `menu_foolproof_story_name_color` VARCHAR(255) NULL,
    `menu_foolproof_stroy_information_size` INTEGER NULL,
    `menu_foolproof_stroy_information_weight` VARCHAR(255) NULL,
    `menu_foolproof_stroy_information_color` VARCHAR(255) NULL,
    `menu_foolproof_stroy_item1_size` INTEGER NULL,
    `menu_foolproof_stroy_item1_weight` VARCHAR(255) NULL,
    `menu_foolproof_stroy_item1_color` VARCHAR(255) NULL,
    `menu_foolproof_stroy_item2_size` INTEGER NULL,
    `menu_foolproof_stroy_item2_weight` VARCHAR(255) NULL,
    `menu_foolproof_stroy_item2_color` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MainMenus` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `view_color` VARCHAR(255) NULL,
    `news_font_size` INTEGER NULL,
    `news_color` VARCHAR(255) NULL,
    `news_weight` VARCHAR(255) NULL,
    `story_type_size` INTEGER NULL,
    `story_type_color` VARCHAR(255) NULL,
    `story_type_weight` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `account` VARCHAR(255) NULL,
    `password` VARCHAR(255) NULL,
    `birthday` VARCHAR(255) NULL,
    `sex` VARCHAR(255) NULL,
    `role` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `News` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `news_content` TEXT NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NoChapters` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `storyid` INTEGER NULL,
    `read_free` VARCHAR(255) NULL,
    `read_range_end` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PurchaseHistories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `memberId` INTEGER NULL,
    `order_num` INTEGER NULL,
    `order_time` VARCHAR(255) NULL,
    `product_name` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `storyid` INTEGER NULL,
    `role_name` VARCHAR(255) NULL,
    `role_sex` VARCHAR(255) NULL,
    `role_infor` TEXT NULL,
    `role_pic` VARCHAR(255) NULL,
    `role_foolproof_title` VARCHAR(255) NULL,
    `role_foolproof_content` TEXT NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Screenings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `order` VARCHAR(255) NULL,
    `storyid` INTEGER NULL,
    `chapterid` INTEGER NULL,
    `screenings_name` VARCHAR(255) NULL,
    `bg_view` VARCHAR(255) NULL,
    `field_effect` VARCHAR(255) NULL,
    `field_sec` VARCHAR(255) NULL,
    `free_read` VARCHAR(255) NULL,
    `main_role` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SequelizeMeta` (
    `name` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `name`(`name`),
    PRIMARY KEY (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SetupChapters` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `chapter_infor_size` INTEGER NULL,
    `chapter_infor_weight` VARCHAR(255) NULL,
    `chapter_infor_color` VARCHAR(255) NULL,
    `chapter_outer_color` VARCHAR(255) NULL,
    `chapter_outer_weight` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SetupDialogues` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `dialogue_size` INTEGER NULL,
    `dialogue_weight` VARCHAR(255) NULL,
    `dialogue_color` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SetupStories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `main_menu_font_size` INTEGER NULL,
    `stroy_name_weight` VARCHAR(255) NULL,
    `stroy_name_size` INTEGER NULL,
    `stroy_name_color` VARCHAR(255) NULL,
    `author_name_size` INTEGER NULL,
    `author_name_weight` VARCHAR(255) NULL,
    `author_name_color` VARCHAR(255) NULL,
    `story_infor_size` INTEGER NULL,
    `story_infor_weight` VARCHAR(255) NULL,
    `story_infor_color` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SetupStoryLists` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `stroy_name_size` INTEGER NULL,
    `stroy_name_weight` VARCHAR(255) NULL,
    `stroy_name_color` VARCHAR(255) NULL,
    `author_size` INTEGER NULL,
    `author_weight` VARCHAR(255) NULL,
    `author_color` VARCHAR(255) NULL,
    `story_infor_size` INTEGER NULL,
    `story_infor_weight` VARCHAR(255) NULL,
    `story_infor_color` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SetupStoryRoleFoolproofs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `setup_story_role_foolproof_name_size` INTEGER NULL,
    `setup_story_role_foolproof_name_weight` VARCHAR(255) NULL,
    `setup_story_role_foolproof_name_color` VARCHAR(255) NULL,
    `setup_story_role_foolproof_information_size` INTEGER NULL,
    `setup_story_role_foolproof_information_weight` VARCHAR(255) NULL,
    `setup_story_role_foolproof_information_color` VARCHAR(255) NULL,
    `setup_story_role_foolproof_size` INTEGER NULL,
    `setup_story_role_foolproof_weight` VARCHAR(255) NULL,
    `setup_story_role_foolproof_color` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SetupStoryRoles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `role_name_size` INTEGER NULL,
    `role_name_weight` VARCHAR(255) NULL,
    `role_name_color` VARCHAR(255) NULL,
    `role_infor_size` INTEGER NULL,
    `role_infor_weight` VARCHAR(255) NULL,
    `role_infor_color` VARCHAR(255) NULL,
    `main_Role_Name_Color` VARCHAR(255) NULL,
    `boy_Supporting_Color` VARCHAR(255) NULL,
    `girl_Supporting_Color` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoryContents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `storyid` INTEGER NULL,
    `chapterid` INTEGER NULL,
    `screeningid` INTEGER NULL,
    `order` VARCHAR(255) NULL,
    `contentPresent` VARCHAR(255) NULL,
    `role` VARCHAR(255) NULL,
    `roleName` VARCHAR(255) NULL,
    `textContent` TEXT NULL,
    `textContentSize` INTEGER NULL,
    `textContentWeight` VARCHAR(255) NULL,
    `textContentColor` VARCHAR(255) NULL,
    `textContentBaseColor` VARCHAR(255) NULL,
    `graphy` VARCHAR(255) NULL,
    `voice` VARCHAR(255) NULL,
    `video` VARCHAR(255) NULL,
    `videoFormat` VARCHAR(255) NULL,
    `integer` VARCHAR(255) NULL,
    `choice1Content` TEXT NULL,
    `choice1Size` INTEGER NULL,
    `choice1Weight` VARCHAR(255) NULL,
    `choice1Color` VARCHAR(255) NULL,
    `choice1BaseColor` VARCHAR(255) NULL,
    `choice1Next` VARCHAR(255) NULL,
    `choice2Content` TEXT NULL,
    `choice2Size` INTEGER NULL,
    `choice2Weight` VARCHAR(255) NULL,
    `choice2Color` VARCHAR(255) NULL,
    `choice2BaseColor` VARCHAR(255) NULL,
    `choice2Next` VARCHAR(255) NULL,
    `choice3Content` TEXT NULL,
    `choice3Size` INTEGER NULL,
    `choice3Weight` VARCHAR(255) NULL,
    `choice3Color` VARCHAR(255) NULL,
    `choice3BaseColor` VARCHAR(255) NULL,
    `choice3Next` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoryTypes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lang` VARCHAR(255) NULL,
    `story_type` TEXT NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubscriptionRecords` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `memberId` INTEGER NULL,
    `sub_num` INTEGER NULL,
    `sub_start_time` VARCHAR(255) NULL,
    `sub_end_time` VARCHAR(255) NULL,
    `sub_plan` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL,
    `updatedAt` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_orders` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `story_list_id` INTEGER NOT NULL,
    `price_coins` INTEGER NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'SUCCESS',
    `idempotency_key` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_story`(`story_list_id`),
    INDEX `idx_user`(`user_id`),
    UNIQUE INDEX `uk_user_idem`(`user_id`, `idempotency_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coin_packs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `platform` VARCHAR(20) NOT NULL,
    `product_id` VARCHAR(100) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `amount` INTEGER NOT NULL,
    `bonus_amount` INTEGER NOT NULL DEFAULT 0,
    `price` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `coin_packs_platform_product_id_key`(`platform`, `product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entitlements` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `story_list_id` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user`(`user_id`),
    UNIQUE INDEX `uk_user_story`(`user_id`, `story_list_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `book_store_items` ADD CONSTRAINT `book_store_items_ibfk_1` FOREIGN KEY (`storyListId`) REFERENCES `StoryLists`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- RenameIndex
ALTER TABLE `User` RENAME INDEX `User_email_key` TO `email`;

-- RenameIndex
ALTER TABLE `User` RENAME INDEX `User_providerId_key` TO `providerId`;
