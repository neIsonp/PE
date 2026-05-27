import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("AdminCACA2026!", 12);

  await prisma.user.upsert({
    where: { email: "admin@caca.uac.pt" },
    update: {},
    create: {
      name: "Administrador CACA",
      email: "admin@caca.uac.pt",
      passwordHash,
      role: "ADMIN",
      institution: "Centro Académico Clínico dos Açores"
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
