import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const story = await prisma.userStory.findUnique({
    where: { id },
  });

  if (!story) {
    return NextResponse.json(
      { error: "Historia no encontrada" },
      { status: 404 }
    );
  }

  const tasks = await prisma.storyTask.findMany({
    where: {
      userStoryId: id,
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(tasks);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (!body.title || !body.createdById) {
    return NextResponse.json(
      { error: "Falta título o usuario creador" },
      { status: 400 }
    );
  }

  const story = await prisma.userStory.findUnique({
    where: { id },
  });

  if (!story) {
    return NextResponse.json(
      { error: "Historia no encontrada" },
      { status: 404 }
    );
  }

  const task = await prisma.storyTask.create({
    data: {
      userStoryId: id,
      title: body.title,
      description: body.description || null,
      status: body.status || "PENDIENTE",
      priority: body.priority || "MEDIA",
      assignedToId: body.assignedToId || null,
      createdById: body.createdById,
      startDate: body.startDate ? new Date(body.startDate) : null,
      estimatedEndDate: body.estimatedEndDate
        ? new Date(body.estimatedEndDate)
        : null,
      actualEndDate: body.actualEndDate ? new Date(body.actualEndDate) : null,
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
      userId: body.createdById,
      entityType: "StoryTask",
      entityId: task.id,
      action: "CREATED",
      oldValues: {},
      newValues: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        userStoryId: task.userStoryId,
        assignedToId: task.assignedToId,
        createdById: task.createdById,
        startDate: task.startDate,
        estimatedEndDate: task.estimatedEndDate,
        actualEndDate: task.actualEndDate,
      },
    },
  });

  return NextResponse.json(task, { status: 201 });
}