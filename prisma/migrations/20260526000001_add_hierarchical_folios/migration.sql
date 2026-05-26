-- Add hierarchical folio fields
ALTER TABLE "Project"
ADD COLUMN IF NOT EXISTS "folioPrefix" TEXT,
ADD COLUMN IF NOT EXISTS "folioNumber" INTEGER,
ADD COLUMN IF NOT EXISTS "folio" TEXT;

ALTER TABLE "UserStory"
ADD COLUMN IF NOT EXISTS "folioNumber" INTEGER,
ADD COLUMN IF NOT EXISTS "folio" TEXT;

ALTER TABLE "StoryTask"
ADD COLUMN IF NOT EXISTS "folioNumber" INTEGER,
ADD COLUMN IF NOT EXISTS "folio" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Project_folio_key" ON "Project"("folio");
CREATE UNIQUE INDEX IF NOT EXISTS "UserStory_folio_key" ON "UserStory"("folio");
CREATE UNIQUE INDEX IF NOT EXISTS "StoryTask_folio_key" ON "StoryTask"("folio");

ALTER TABLE "StoryTask" ALTER COLUMN "status" SET DEFAULT 'ANALISIS';
