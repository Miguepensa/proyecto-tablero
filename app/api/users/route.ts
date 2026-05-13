import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error al cargar usuarios:", error);

    return NextResponse.json(
      { error: "No se pudieron cargar los usuarios" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, role, password } = body;

    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: "Nombre, correo, rol y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese correo" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        passwordHash,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: "User",
        entityId: user.id,
        action: "CREATED",
        oldValues: {},
        newValues: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
        },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error al crear usuario:", error);

    return NextResponse.json(
      { error: "No se pudo crear el usuario" },
      { status: 500 }
    );
  }
}