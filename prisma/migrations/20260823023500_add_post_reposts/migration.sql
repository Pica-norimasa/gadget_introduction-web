ALTER TABLE `Repost` MODIFY `projectId` VARCHAR(191) NULL;

ALTER TABLE `Repost` ADD COLUMN `postId` VARCHAR(191) NULL;

CREATE INDEX `Repost_postId_idx` ON `Repost`(`postId`);

CREATE UNIQUE INDEX `Repost_userId_postId_key` ON `Repost`(`userId`, `postId`);

ALTER TABLE `Repost` ADD CONSTRAINT `Repost_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
