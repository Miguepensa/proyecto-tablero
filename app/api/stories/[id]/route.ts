import { prisma } from "@/lib/prisma";
import { buildRequirementFolio, buildStoryFolio } from "@/lib/folios";
import { NextResponse } from "next/server";

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
  const { id } = await params;
  const body = await req.json();

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

  const nextProjectId = body.projectId || existingStory.projectId;
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

  const updatedStory = await prisma.userStory.update({
    where: { id },
    data: {
      folioNumber: nextFolioNumber,
      folio: nextFolio,
      title: body.title,
      description: body.description,
      priority: body.priority,
      status: body.status,
      projectId: nextProjectId,
      assignedToId: body.assignedToId || null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      estimatedEndDate: body.estimatedEndDate
        ? new Date(body.estimatedEndDate)
        : null,
      actualEndDate: body.actualEndDate ? new Date(body.actualEndDate) : null,
    },
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
