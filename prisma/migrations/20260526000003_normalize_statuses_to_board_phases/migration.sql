-- Normalize old statuses to the new board phases.
-- Run after 20260526000002_add_phase_enum_values_to_projects_and_stories.

UPDATE "Project"
SET "status" = CASE
  WHEN "status"::text = 'PENDIENTE' THEN 'ANALISIS'::"ProjectStatus"
  WHEN "status"::text = 'EN_PROGRESO' THEN 'DESARROLLO_IMPLEMENTACION'::"ProjectStatus"
  WHEN "status"::text = 'BLOQUEADO' THEN 'TRANSICION'::"ProjectStatus"
  WHEN "status"::text = 'CANCELADO' THEN 'TRANSICION'::"ProjectStatus"
  WHEN "status"::text = 'TERMINADO' THEN 'PUESTA_EN_MARCHA'::"ProjectStatus"
  ELSE "status"
END;

ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'ANALISIS';

UPDATE "UserStory"
SET "status" = CASE
  WHEN "status"::text = 'BACKLOG' THEN 'ANALISIS'::"StoryStatus"
  WHEN "status"::text = 'PENDIENTE' THEN 'ANALISIS'::"StoryStatus"
  WHEN "status"::text = 'EN_PROGRESO' THEN 'DESARROLLO_IMPLEMENTACION'::"StoryStatus"
  WHEN "status"::text = 'BLOQUEADO' THEN 'TRANSICION'::"StoryStatus"
  WHEN "status"::text = 'REVISION' THEN 'PRUEBAS'::"StoryStatus"
  WHEN "status"::text = 'CANCELADO' THEN 'TRANSICION'::"StoryStatus"
  WHEN "status"::text = 'TERMINADO' THEN 'PUESTA_EN_MARCHA'::"StoryStatus"
  ELSE "status"
END;

ALTER TABLE "UserStory" ALTER COLUMN "status" SET DEFAULT 'ANALISIS';

UPDATE "StoryTask"
SET "status" = CASE
  WHEN "status"::text = 'PENDIENTE' THEN 'ANALISIS'::"TaskStatus"
  WHEN "status"::text = 'EN_PROGRESO' THEN 'DESARROLLO_IMPLEMENTACION'::"TaskStatus"
  WHEN "status"::text = 'BLOQUEADO' THEN 'DESARROLLO_IMPLEMENTACION'::"TaskStatus"
  WHEN "status"::text = 'CANCELADO' THEN 'TRANSICION'::"TaskStatus"
  WHEN "status"::text = 'TERMINADO' THEN 'PUESTA_EN_MARCHA'::"TaskStatus"
  ELSE "status"
END;

ALTER TABLE "StoryTask" ALTER COLUMN "status" SET DEFAULT 'ANALISIS';
