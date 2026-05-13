import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

  const existingStory = await prisma.userStory.findUnique({
    where: { id },
  });

  if (!existingStory) {
    return NextResponse.json(
      { error: "Historia no encontrada" },
      { status: 404 }
    );
  }

  const updatedStory = await prisma.userStory.update({
    where: { id },
    data: {
      title: body.title ?? existingStory.title,
      description: body.description ?? existingStory.description,
      status: body.status ?? existingStory.status,
      priority: body.priority ?? existingStory.priority,
      assignedToId: body.assignedToId ?? existingStory.assignedToId,
      startDate:
        body.startDate !== undefined
          ? body.startDate
            ? new Date(body.startDate)
            : null
          : existingStory.startDate,
      estimatedEndDate:
        body.estimatedEndDate !== undefined
          ? body.estimatedEndDate
            ? new Date(body.estimatedEndDate)
            : null
          : existingStory.estimatedEndDate,
      actualEndDate:
        body.actualEndDate !== undefined
          ? body.actualEndDate
            ? new Date(body.actualEndDate)
            : null
          : body.status === "TERMINADO"
            ? new Date()
            : existingStory.actualEndDate,
    },
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

  return NextResponse.json(updatedStory);
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

  return NextResponse.json({
    ok: true,
    message: "Historia eliminada correctamente",
  });
}