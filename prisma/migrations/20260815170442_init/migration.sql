-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Project" (
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
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Project_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Post_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Reaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE INDEX "Post_projectId_idx" ON "Post"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_projectId_userId_type_key" ON "Reaction"("projectId", "userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");
