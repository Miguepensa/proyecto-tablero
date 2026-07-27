import { prisma } from "@/lib/prisma";
import { parseWorkflowStatus } from "@/lib/statuses";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const task = await prisma.storyTask.findUnique({
    where: { id },
    include: {
      userStory: {
        include: {
          project: true,
        },
      },
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
  });

  if (!task) {
    return NextResponse.json(
      { error: "Requerimiento no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(task);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const existingTask = await prisma.storyTask.findUnique({
    where: { id },
  });

  if (!existingTask) {
    return NextResponse.json(
      { error: "Requerimiento no encontrado" },
      { status: 404 }
    );
  }

  const nextStatus =
    body.status !== undefined
      ? parseWorkflowStatus(body.status)
      : existingTask.status;

  if (!nextStatus) {
    return NextResponse.json(
      { error: "El estado del requerimiento no es válido" },
      { status: 400 },
    );
  }

  const updatedTask = await prisma.storyTask.update({
    where: { id },
    data: {
      title: body.title ?? existingTask.title,
      description: body.description ?? existingTask.description,
      status: nextStatus,
      priority: body.priority ?? existingTask.priority,
      assignedToId:
        body.assignedToId !== undefined
          ? body.assignedToId || null
          : existingTask.assignedToId,
      startDate:
        body.startDate !== undefined
          ? body.startDate
            ? new Date(body.startDate)
            : null
          : existingTask.startDate,
      estimatedEndDate:
        body.estimatedEndDate !== undefined
          ? body.estimatedEndDate
            ? new Date(body.estimatedEndDate)
            : null
          : existingTask.estimatedEndDate,
      actualEndDate:
        body.actualEndDate !== undefined
          ? body.actualEndDate
            ? new Date(body.actualEndDate)
            : null
          : body.status !== undefined
            ? nextStatus === "PUESTA_EN_MARCHA"
              ? new Date()
              : null
            : existingTask.actualEndDate,
    },
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
  });

  await prisma.auditLog.create({
    data: {
      userId: updatedTask.assignedToId || updatedTask.createdById,
      entityType: "StoryTask",
      entityId: updatedTask.id,
      action: "UPDATED",
      oldValues: {
        folioNumber: existingTask.folioNumber,
        folio: existingTask.folio,
        title: existingTask.title,
        description: existingTask.description,
        status: existingTask.status,
        priority: existingTask.priority,
        assignedToId: existingTask.assignedToId,
        startDate: existingTask.startDate,
        estimatedEndDate: existingTask.estimatedEndDate,
        actualEndDate: existingTask.actualEndDate,
      },
      newValues: {
        folioNumber: updatedTask.folioNumber,
        folio: updatedTask.folio,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        assignedToId: updatedTask.assignedToId,
        startDate: updatedTask.startDate,
        estimatedEndDate: updatedTask.estimatedEndDate,
        actualEndDate: updatedTask.actualEndDate,
      },
    },
  });

  return NextResponse.json(updatedTask);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "Falta el usuario que intenta eliminar" },
      { status: 400 }
    );
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!currentUser || currentUser.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Solo el administrador puede eliminar requerimientos" },
      { status: 403 }
    );
  }

  const existingTask = await prisma.storyTask.findUnique({
    where: { id },
  });

  if (!existingTask) {
    return NextResponse.json(
      { error: "Requerimiento no encontrado" },
      { status: 404 }
    );
  }

  await prisma.auditLog.create({
    data: {
      userId: currentUser.id,
      entityType: "StoryTask",
      entityId: existingTask.id,
      action: "DELETED",
      oldValues: {
        id: existingTask.id,
        folioNumber: existingTask.folioNumber,
        folio: existingTask.folio,
        title: existingTask.title,
        description: existingTask.description,
        status: existingTask.status,
        priority: existingTask.priority,
        userStoryId: existingTask.userStoryId,
        assignedToId: existingTask.assignedToId,
        createdById: existingTask.createdById,
        startDate: existingTask.startDate,
        estimatedEndDate: existingTask.estimatedEndDate,
        actualEndDate: existingTask.actualEndDate,
      },
      newValues: {},
    },
  });

  await prisma.storyTask.delete({
    where: { id },
  });

  return NextResponse.json({
    ok: true,
    message: "Requerimiento eliminado correctamente",
  });
}
