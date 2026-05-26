import { prisma } from "@/lib/prisma";
import { buildStoryFolio } from "@/lib/folios";
import { NextResponse } from "next/server";

export async function GET() {
  const stories = await prisma.userStory.findMany({
    include: {
      project: true,
      assignedTo: true,
      createdBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(stories);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.title || !body.projectId || !body.createdById) {
      return NextResponse.json(
        { error: "Falta título, proyecto o usuario creador" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    if (!project.folio) {
      return NextResponse.json(
        {
          error:
            "Este proyecto todavía no tiene folio. Ejecuta el script de folios para registros existentes.",
        },
        { status: 400 }
      );
    }

    const latestStory = await prisma.userStory.findFirst({
      where: {
        projectId: body.projectId,
        folioNumber: {
          not: null,
        },
      },
      orderBy: {
        folioNumber: "desc",
      },
    });

    const folioNumber = (latestStory?.folioNumber ?? 0) + 1;
    const folio = buildStoryFolio(project.folio, folioNumber);

    const story = await prisma.userStory.create({
      data: {
        folioNumber,
        folio,
        title: body.title,
        description: body.description,
        priority: body.priority ?? "MEDIA",
        status: body.status ?? "ANALISIS",
        projectId: body.projectId,
        assignedToId: body.assignedToId,
        createdById: body.createdById,
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

    return NextResponse.json(story, { status: 201 });
  } catch (error) {
    console.error("Error al crear historia:", error);

    return NextResponse.json(
      { error: "No se pudo crear la historia" },
      { status: 500 }
    );
  }
}
