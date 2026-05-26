import { PrismaClient } from "@prisma/client";
import {
  buildProjectFolio,
  buildRequirementFolio,
  buildStoryFolio,
  getFallbackPrefixFromName,
  isValidFolioPrefix,
  normalizeFolioPrefix,
} from "../lib/folios";

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });

  const projectCounters = new Map<string, number>();

  for (const project of projects) {
    if (
      project.folioPrefix &&
      project.folioNumber &&
      project.folio &&
      isValidFolioPrefix(project.folioPrefix)
    ) {
      projectCounters.set(
        project.folioPrefix,
        Math.max(projectCounters.get(project.folioPrefix) ?? 0, project.folioNumber)
      );
      continue;
    }

    const prefixCandidate = normalizeFolioPrefix(
      project.folioPrefix || getFallbackPrefixFromName(project.name)
    );

    const prefix = isValidFolioPrefix(prefixCandidate)
      ? prefixCandidate
      : "GEN";

    const nextNumber = (projectCounters.get(prefix) ?? 0) + 1;
    projectCounters.set(prefix, nextNumber);

    const folio = buildProjectFolio(prefix, nextNumber);

    await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        folioPrefix: prefix,
        folioNumber: nextNumber,
        folio,
      },
    });

    console.log(`Proyecto foliado: ${folio} - ${project.name}`);
  }

  const projectsWithFolios = await prisma.project.findMany({
    include: {
      stories: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  for (const project of projectsWithFolios) {
    if (!project.folio) continue;

    let storyCounter = 0;

    for (const story of project.stories) {
      storyCounter += 1;

      const storyFolio =
        story.folio && story.folioNumber
          ? story.folio
          : buildStoryFolio(project.folio, storyCounter);

      const storyFolioNumber = story.folioNumber ?? storyCounter;

      if (!story.folio || !story.folioNumber) {
        await prisma.userStory.update({
          where: {
            id: story.id,
          },
          data: {
            folioNumber: storyFolioNumber,
            folio: storyFolio,
          },
        });

        console.log(`Historia foliada: ${storyFolio} - ${story.title}`);
      }

      const tasks = await prisma.storyTask.findMany({
        where: {
          userStoryId: story.id,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      let taskCounter = 0;

      for (const task of tasks) {
        taskCounter += 1;

        if (task.folio && task.folioNumber) continue;

        const taskFolioNumber = task.folioNumber ?? taskCounter;
        const taskFolio = buildRequirementFolio(
          storyFolio,
          taskFolioNumber
        );

        await prisma.storyTask.update({
          where: {
            id: task.id,
          },
          data: {
            folioNumber: taskFolioNumber,
            folio: taskFolio,
          },
        });

        console.log(`Requerimiento foliado: ${taskFolio} - ${task.title}`);
      }
    }
  }

  console.log("Folios generados correctamente.");
}

main()
  .catch((error) => {
    console.error("Error generando folios:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
