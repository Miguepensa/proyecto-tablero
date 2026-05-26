import { prisma } from "@/lib/prisma";
import {
  buildProjectFolio,
  isValidFolioPrefix,
  normalizeFolioPrefix,
} from "@/lib/folios";
import { NextResponse } from "next/server";

export async function GET() {
  const projects = await prisma.project.findMany({
    include: {
      owner: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body.name ?? "").trim();
    const description = body.description ? String(body.description).trim() : "";
    const folioPrefix = normalizeFolioPrefix(String(body.folioPrefix ?? ""));

    if (!name) {
      return NextResponse.json(
        { error: "El nombre del proyecto es obligatorio" },
        { status: 400 }
      );
    }

    if (!isValidFolioPrefix(folioPrefix)) {
      return NextResponse.json(
        {
          error:
            "La clave de folio es obligatoria y debe tener exactamente 3 caracteres alfanuméricos.",
        },
        { status: 400 }
      );
    }

    if (!body.ownerId) {
      return NextResponse.json(
        { error: "El responsable del proyecto es obligatorio" },
        { status: 400 }
      );
    }

    const latestProject = await prisma.project.findFirst({
      where: {
        folioPrefix,
        folioNumber: {
          not: null,
        },
      },
      orderBy: {
        folioNumber: "desc",
      },
    });

    const folioNumber = (latestProject?.folioNumber ?? 0) + 1;
    const folio = buildProjectFolio(folioPrefix, folioNumber);

    const project = await prisma.project.create({
      data: {
        folioPrefix,
        folioNumber,
        folio,
        name,
        description,
        status: body.status ?? "PENDIENTE",
        ownerId: body.ownerId,
        startDate: body.startDate ? new Date(body.startDate) : null,
        estimatedEndDate: body.estimatedEndDate
          ? new Date(body.estimatedEndDate)
          : null,
        actualEndDate: body.actualEndDate ? new Date(body.actualEndDate) : null,
      },
      include: {
        owner: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error al crear proyecto:", error);

    return NextResponse.json(
      { error: "No se pudo crear el proyecto" },
      { status: 500 }
    );
  }
}
