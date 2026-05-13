import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { password } = body;

  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
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
        userId: existingUser.id,
        entityType: "User",
        entityId: existingUser.id,
        action: "PASSWORD_CHANGED",
        oldValues: {},
        newValues: {
          passwordChanged: true,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Contraseña actualizada correctamente",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error al actualizar contraseña:", error);

    return NextResponse.json(
      { error: "No se pudo actualizar la contraseña" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  if (!existingUser.active) {
    return NextResponse.json({
      ok: true,
      message: "El usuario ya estaba inactivo",
    });
  }

  if (existingUser.role === "ADMIN") {
    const activeAdmins = await prisma.user.count({
      where: {
        role: "ADMIN",
        active: true,
        NOT: {
          id,
        },
      },
    });

    if (activeAdmins === 0) {
      return NextResponse.json(
        {
          error:
            "No puedes desactivar al último administrador activo del sistema.",
        },
        { status: 400 }
      );
    }
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        active: false,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: existingUser.id,
        entityType: "User",
        entityId: existingUser.id,
        action: "DEACTIVATED",
        oldValues: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          active: existingUser.active,
        },
        newValues: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          active: updatedUser.active,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Usuario desactivado correctamente",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error al desactivar usuario:", error);

    return NextResponse.json(
      { error: "No se pudo desactivar el usuario" },
      { status: 500 }
    );
  }
}