-- DropForeignKey
ALTER TABLE `Repost` DROP FOREIGN KEY `Repost_postId_fkey`;

-- DropForeignKey
ALTER TABLE `Repost` DROP FOREIGN KEY `Repost_projectId_fkey`;

-- AddForeignKey
ALTER TABLE `Repost` ADD CONSTRAINT `Repost_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Repost` ADD CONSTRAINT `Repost_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
