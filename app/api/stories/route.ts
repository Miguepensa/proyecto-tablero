import { prisma } from "@/lib/prisma";
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
  const body = await req.json();

  const story = await prisma.userStory.create({
    data: {
      title: body.title,
      description: body.description,
      priority: body.priority ?? "MEDIA",
      status: body.status ?? "BACKLOG",
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
}