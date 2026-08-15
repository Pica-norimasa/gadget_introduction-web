-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "catchText" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "tool" TEXT,
    "platforms" JSONB NOT NULL,
    "hue" INTEGER NOT NULL,
    "glyph" TEXT,
    "githubUrl" TEXT,
    "hasMotion" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "trendScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentsSeed" INTEGER NOT NULL DEFAULT 0,
    "reactionInterestingSeed" INTEGER NOT NULL DEFAULT 0,
    "reactionUsefulSeed" INTEGER NOT NULL DEFAULT 0,
    "reactionIdeaSeed" INTEGER NOT NULL DEFAULT 0,
    "reactionWantToTrySeed" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Project_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("authorId", "catchText", "category", "createdAt", "githubUrl", "glyph", "hasMotion", "hue", "id", "platforms", "stage", "title", "tool", "trendScore", "views") SELECT "authorId", "catchText", "category", "createdAt", "githubUrl", "glyph", "hasMotion", "hue", "id", "platforms", "stage", "title", "tool", "trendScore", "views" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
