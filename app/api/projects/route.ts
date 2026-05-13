import { prisma } from "@/lib/prisma";
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
  const body = await req.json();

  const project = await prisma.project.create({
    data: {
      name: body.name,
      description: body.description,
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
}