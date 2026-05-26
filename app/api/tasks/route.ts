import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const tasks = await prisma.storyTask.findMany({
      include: {
        userStory: {
          include: {
            project: true,
          },
        },
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
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error al cargar requerimientos:", error);

    return NextResponse.json(
      { error: "No se pudieron cargar los requerimientos" },
      { status: 500 }
    );
  }
}
