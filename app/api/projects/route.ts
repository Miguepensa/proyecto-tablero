import { prisma } from "@/lib/prisma";
import {
  buildProjectFolio,
  isValidFolioPrefix,
  normalizeFolioPrefix,
} from "@/lib/folios";
import { parseWorkflowStatus } from "@/lib/statuses";
import { parseProjectType } from "@/lib/projectTypes";
import { normalizeResponsibleIds } from "@/lib/projectResponsibles";
import { NextResponse } from "next/server";

const projectInclude = {
  owner: true,
  responsibles: {
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "asc" as const,
    },
  },
};

export async function GET() {
  const projects = await prisma.project.findMany({
    include: projectInclude,
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
    const status = parseWorkflowStatus(body.status ?? "ANALISIS");
    const type = parseProjectType(body.type);
    const responsibleIds = normalizeResponsibleIds(
      body.responsibleIds,
      body.ownerId,
    );

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

    if (responsibleIds.length === 0) {
      return NextResponse.json(
        { error: "Selecciona al menos un responsable del proyecto" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "El estado del proyecto no es válido" },
        { status: 400 },
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: "Selecciona el tipo de proyecto" },
        { status: 400 },
      );
    }

    const existingResponsibleCount = await prisma.user.count({
      where: {
        id: {
          in: responsibleIds,
        },
      },
    });

    if (existingResponsibleCount !== responsibleIds.length) {
      return NextResponse.json(
        { error: "Uno o más responsables seleccionados no existen" },
        { status: 400 },
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
        type,
        status,
        ownerId: responsibleIds[0],
        responsibles: {
          create: responsibleIds.map((userId) => ({
            userId,
          })),
        },
        startDate: body.startDate ? new Date(body.startDate) : null,
        estimatedEndDate: body.estimatedEndDate
          ? new Date(body.estimatedEndDate)
          : null,
        actualEndDate: body.actualEndDate ? new Date(body.actualEndDate) : null,
      },
      include: projectInclude,
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
