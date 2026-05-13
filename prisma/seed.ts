import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@admin.com";
  const password = "Admin123";

  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log("El usuario admin ya existe");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name: "Administrador",
      email,
      passwordHash,
      role: "ADMIN",
      active: true,
    },
  });

  console.log("Usuario admin creado correctamente");
  console.log("Correo:", email);
  console.log("Contraseña:", password);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });