import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  const { id } = await params;

  const existingProject = await prisma.project.findUnique({
    where: { id },
  });

  if (!existingProject) {
    return NextResponse.json(
      { error: "Proyecto no encontrado" },
      { status: 404 }
    );
  }

  const updatedProject = await prisma.project.update({
    where: { id },
    data: {
      status: body.status,
      actualEndDate:
        body.status === "TERMINADO"
          ? new Date()
          : existingProject.actualEndDate,
    },
    include: {
      owner: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: updatedProject.ownerId,
      entityType: "Project",
      entityId: updatedProject.id,
      action: "STATUS_CHANGED",
      oldValues: {
        status: existingProject.status,
        actualEndDate: existingProject.actualEndDate,
      },
      newValues: {
        status: updatedProject.status,
        actualEndDate: updatedProject.actualEndDate,
      },
    },
  });

  return NextResponse.json(updatedProject);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existingProject = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: true,
    },
  });

  if (!existingProject) {
    return NextResponse.json(
      { error: "Proyecto no encontrado" },
      { status: 404 }
    );
  }

  try {
    await prisma.auditLog.create({
      data: {
        userId: existingProject.ownerId,
        entityType: "Project",
        entityId: existingProject.id,
        action: "DELETED",
        oldValues: {
          id: existingProject.id,
          name: existingProject.name,
          description: existingProject.description,
          status: existingProject.status,
          ownerId: existingProject.ownerId,
          startDate: existingProject.startDate,
          estimatedEndDate: existingProject.estimatedEndDate,
          actualEndDate: existingProject.actualEndDate,
        },
        newValues: {},
      },
    });

    await prisma.userStory.deleteMany({
      where: {
        projectId: id,
      },
    });

    await prisma.project.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Proyecto eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar proyecto:", error);

    return NextResponse.json(
      { error: "No se pudo eliminar el proyecto" },
      { status: 500 }
    );
  }
}