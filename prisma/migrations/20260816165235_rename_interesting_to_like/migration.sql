-- Rename the "interesting" (😲面白い) reaction to "like" (❤️いいね) on Projects,
-- consolidating it with the generic like semantics shared with Post reactions.
-- Column rename + historical data conversion, no destructive table rebuild needed.

ALTER TABLE "Project" RENAME COLUMN "reactionInterestingSeed" TO "reactionLikeSeed";

UPDATE "Reaction" SET "type" = 'like' WHERE "type" = 'interesting' AND "projectId" IS NOT NULL;

UPDATE "Notification" SET "reactionType" = 'like' WHERE "reactionType" = 'interesting';
