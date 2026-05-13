-- CreateTable
CREATE TABLE "StoryTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userStoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "priority" TEXT NOT NULL DEFAULT 'MEDIA',
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "startDate" DATETIME,
    "estimatedEndDate" DATETIME,
    "actualEndDate" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StoryTask_userStoryId_fkey" FOREIGN KEY ("userStoryId") REFERENCES "UserStory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StoryTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "percentComplete" INTEGER,
    "hoursSpent" REAL,
    "activityDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskActivity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "StoryTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
