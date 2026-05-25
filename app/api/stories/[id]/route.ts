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
      title: body.title,
      description: body.description,
      priority: body.priority,
      status: body.status,
      projectId: body.projectId,
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
