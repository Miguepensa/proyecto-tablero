import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const activities = await prisma.taskActivity.findMany({
    where: {
      taskId: id,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(activities);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (!body.userId || !body.comment) {
    return NextResponse.json(
      { error: "Falta usuario o comentario" },
      { status: 400 }
    );
  }

  const task = await prisma.storyTask.findUnique({
    where: { id },
  });

  if (!task) {
    return NextResponse.json(
      { error: "Actividad no encontrada" },
      { status: 404 }
    );
  }

  const percentComplete =
    body.percentComplete !== undefined &&
    body.percentComplete !== null &&
    body.percentComplete !== ""
      ? Number(body.percentComplete)
      : null;

  const hoursSpent =
    body.hoursSpent !== undefined &&
    body.hoursSpent !== null &&
    body.hoursSpent !== ""
      ? Number(body.hoursSpent)
      : null;

  const activity = await prisma.taskActivity.create({
    data: {
      taskId: id,
      userId: body.userId,
      comment: body.comment,
      percentComplete,
      hoursSpent,
      activityDate: body.activityDate ? new Date(body.activityDate) : new Date(),
    },
    include: {
      user: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: body.userId,
      entityType: "TaskActivity",
      entityId: activity.id,
      action: "CREATED",
      oldValues: {},
      newValues: {
        taskId: id,
        comment: activity.comment,
        percentComplete: activity.percentComplete,
        hoursSpent: activity.hoursSpent,
        activityDate: activity.activityDate,
      },
    },
  });

  return NextResponse.json(activity, { status: 201 });
}