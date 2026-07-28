-- CreateTable
CREATE TABLE "ProjectResponsible" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectResponsible_pkey" PRIMARY KEY ("id")
);

-- Preserve every existing project's current owner as its first responsible.
INSERT INTO "ProjectResponsible" ("id", "projectId", "userId", "createdAt")
SELECT
    'legacy-' || md5(project."id" || ':' || project."ownerId"),
    project."id",
    project."ownerId",
    CURRENT_TIMESTAMP
FROM "Project" AS project;

-- CreateIndex
CREATE UNIQUE INDEX "ProjectResponsible_projectId_userId_key"
ON "ProjectResponsible"("projectId", "userId");

-- CreateIndex
CREATE INDEX "ProjectResponsible_userId_idx"
ON "ProjectResponsible"("userId");

-- AddForeignKey
ALTER TABLE "ProjectResponsible"
ADD CONSTRAINT "ProjectResponsible_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectResponsible"
ADD CONSTRAINT "ProjectResponsible_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
