import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function parseDate(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function hasField(body: Record<string, unknown>, field: string) {
  return Object.prototype.hasOwnProperty.call(body, field);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error al obtener proyecto:", error);

    return NextResponse.json(
      { error: "No se pudo obtener el proyecto" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
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

    const isFullEdit =
      hasField(body, "name") ||
      hasField(body, "description") ||
      hasField(body, "ownerId") ||
      hasField(body, "startDate") ||
      hasField(body, "estimatedEndDate") ||
      hasField(body, "actualEndDate");

    const updateData: any = {};

    if (hasField(body, "status")) {
      updateData.status = body.status;
    }

    if (hasField(body, "blocked")) {
      const blocked = Boolean(body.blocked);
      const blockedReason = body.blockedReason
        ? String(body.blockedReason).trim()
        : "";
      const blockedAt = parseDate(body.blockedAt);

      if (blocked && !blockedReason) {
        return NextResponse.json(
          { error: "La observación del bloqueo es obligatoria" },
          { status: 400 }
        );
      }

      updateData.blocked = blocked;
      updateData.blockedReason = blocked ? blockedReason : null;
      updateData.blockedAt = blocked ? blockedAt ?? new Date() : null;
    }

    if (isFullEdit) {
      if (!body.name || !String(body.name).trim()) {
        return NextResponse.json(
          { error: "El nombre del proyecto es obligatorio" },
          { status: 400 }
        );
      }

      updateData.name = String(body.name).trim();
      updateData.description = body.description
        ? String(body.description).trim()
        : "";

      updateData.ownerId = body.ownerId ? String(body.ownerId) : null;
      updateData.startDate = parseDate(body.startDate);
      updateData.estimatedEndDate = parseDate(body.estimatedEndDate);
      updateData.actualEndDate = parseDate(body.actualEndDate);
    } else if (body.status === "PUESTA_EN_MARCHA" || body.status === "TERMINADO") {
      updateData.actualEndDate = new Date();
    } else {
      updateData.actualEndDate = existingProject.actualEndDate;
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        owner: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: updatedProject.ownerId,
        entityType: "Project",
        entityId: updatedProject.id,
        action:
          existingProject.status !== updatedProject.status
            ? "STATUS_CHANGED"
            : "UPDATED",
        oldValues: {
          id: existingProject.id,
          folioPrefix: existingProject.folioPrefix,
          folioNumber: existingProject.folioNumber,
          folio: existingProject.folio,
          name: existingProject.name,
          description: existingProject.description,
          status: existingProject.status,
          ownerId: existingProject.ownerId,
          startDate: existingProject.startDate,
          estimatedEndDate: existingProject.estimatedEndDate,
          actualEndDate: existingProject.actualEndDate,
          blocked: existingProject.blocked,
          blockedReason: existingProject.blockedReason,
          blockedAt: existingProject.blockedAt,
        },
        newValues: {
          id: updatedProject.id,
          folioPrefix: updatedProject.folioPrefix,
          folioNumber: updatedProject.folioNumber,
          folio: updatedProject.folio,
          name: updatedProject.name,
          description: updatedProject.description,
          status: updatedProject.status,
          ownerId: updatedProject.ownerId,
          startDate: updatedProject.startDate,
          estimatedEndDate: updatedProject.estimatedEndDate,
          actualEndDate: updatedProject.actualEndDate,
          blocked: updatedProject.blocked,
          blockedReason: updatedProject.blockedReason,
          blockedAt: updatedProject.blockedAt,
        },
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error al actualizar proyecto:", error);

    return NextResponse.json(
      { error: "No se pudo actualizar el proyecto" },
      { status: 500 }
    );
  }
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
          folioPrefix: existingProject.folioPrefix,
          folioNumber: existingProject.folioNumber,
          folio: existingProject.folio,
          name: existingProject.name,
          description: existingProject.description,
          status: existingProject.status,
          ownerId: existingProject.ownerId,
          startDate: existingProject.startDate,
          estimatedEndDate: existingProject.estimatedEndDate,
          actualEndDate: existingProject.actualEndDate,
          blocked: existingProject.blocked,
          blockedReason: existingProject.blockedReason,
          blockedAt: existingProject.blockedAt,
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