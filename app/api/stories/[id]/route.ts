import { prisma } from "@/lib/prisma";
import { buildRequirementFolio, buildStoryFolio } from "@/lib/folios";
import { NextResponse } from "next/server";

function hasField(body: Record<string, unknown>, field: string) {
  return Object.prototype.hasOwnProperty.call(body, field);
}

function parseDate(value: unknown) {
  if (!value) return null;

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

async function rebuildTaskFoliosForStory(storyId: string, storyFolio: string) {
  const tasks = await prisma.storyTask.findMany({
    where: {
      userStoryId: storyId,
    },
    orderBy: [
      {
        folioNumber: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });

  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];
    const folioNumber = task.folioNumber ?? index + 1;

    await prisma.storyTask.update({
      where: {
        id: task.id,
      },
      data: {
        folioNumber,
        folio: buildRequirementFolio(storyFolio, folioNumber),
      },
    });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const story = await prisma.userStory.findUnique({
    where: { id },
    include: {
      project: true,
      assignedTo: true,
      createdBy: true,
      tasks: {
        include: {
          assignedTo: true,
          createdBy: true,
          activities: {
            include: {
              user: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!story) {
    return NextResponse.json(
      { error: "Historia no encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(story);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Usuario requerido" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Solo el administrador puede modificar historias" },
        { status: 403 }
      );
    }

    const existingStory = await prisma.userStory.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!existingStory) {
      return NextResponse.json(
        { error: "Historia no encontrada" },
        { status: 404 }
      );
    }

    const nextProjectId =
      hasField(body, "projectId") && body.projectId
        ? String(body.projectId)
        : existingStory.projectId;

    const isMovingProject = nextProjectId !== existingStory.projectId;
    let nextFolio = existingStory.folio;
    let nextFolioNumber = existingStory.folioNumber;

    if (!nextFolio || !nextFolioNumber || isMovingProject) {
      const targetProject = await prisma.project.findUnique({
        where: {
          id: nextProjectId,
        },
      });

      if (!targetProject) {
        return NextResponse.json(
          { error: "Proyecto no encontrado" },
          { status: 404 }
        );
      }

      if (!targetProject.folio) {
        return NextResponse.json(
          {
            error:
              "El proyecto seleccionado todavía no tiene folio. Ejecuta el script de folios para registros existentes.",
          },
          { status: 400 }
        );
      }

      const latestStory = await prisma.userStory.findFirst({
        where: {
          projectId: nextProjectId,
          folioNumber: {
            not: null,
          },
          NOT: {
            id,
          },
        },
        orderBy: {
          folioNumber: "desc",
        },
      });

      nextFolioNumber = (latestStory?.folioNumber ?? 0) + 1;
      nextFolio = buildStoryFolio(targetProject.folio, nextFolioNumber);
    }

    const updateData: Record<string, unknown> = {
      folioNumber: nextFolioNumber,
      folio: nextFolio,
    };

    if (isMovingProject) {
      updateData.projectId = nextProjectId;
    }

    if (hasField(body, "title")) {
      const title = String(body.title ?? "").trim();

      if (!title) {
        return NextResponse.json(
          { error: "El título de la historia es obligatorio" },
          { status: 400 }
        );
      }

      updateData.title = title;
    }

    if (hasField(body, "description")) {
      updateData.description = body.description
        ? String(body.description).trim()
        : "";
    }

    if (hasField(body, "priority")) {
      updateData.priority = body.priority;
    }

    if (hasField(body, "status")) {
      updateData.status = body.status;

      if (
        body.status === "PUESTA_EN_MARCHA" &&
        !hasField(body, "actualEndDate")
      ) {
        updateData.actualEndDate = new Date();
      }
    }

    if (hasField(body, "assignedToId") && body.assignedToId) {
      updateData.assignedToId = String(body.assignedToId);
    }

    if (hasField(body, "startDate")) {
      updateData.startDate = parseDate(body.startDate);
    }

    if (hasField(body, "estimatedEndDate")) {
      updateData.estimatedEndDate = parseDate(body.estimatedEndDate);
    }

    if (hasField(body, "actualEndDate")) {
      updateData.actualEndDate = parseDate(body.actualEndDate);
    }

    const updatedStory = await prisma.userStory.update({
      where: { id },
      data: updateData,
      include: {
        project: true,
        assignedTo: true,
        createdBy: true,
      },
    });

    if (nextFolio) {
      await rebuildTaskFoliosForStory(updatedStory.id, nextFolio);
    }

    return NextResponse.json(updatedStory);
  } catch (error) {
    console.error("Error al actualizar historia:", error);

    return NextResponse.json(
      { error: "No se pudo actualizar la historia" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "Usuario requerido" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Solo el administrador puede eliminar historias" },
      { status: 403 }
    );
  }

  const existingStory = await prisma.userStory.findUnique({
    where: { id },
  });

  if (!existingStory) {
    return NextResponse.json(
      { error: "Historia no encontrada" },
      { status: 404 }
    );
  }

  await prisma.userStory.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
