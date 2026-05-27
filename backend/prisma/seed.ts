import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("AdminCACA2026!", 12);

  const admin = await prisma.user.upsert({
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

  await prisma.event.upsert({
    where: { id: "seed-event-health-digital" },
    update: {},
    create: {
      id: "seed-event-health-digital",
      title: "Encontro CACA de Saúde Digital",
      date: "2026-06-12",
      time: "10:00",
      location: "Ponta Delgada,PT",
      description: "Sessão de partilha sobre plataformas digitais e cuidados de proximidade.",
      createdById: admin.id
    }
  });

  await prisma.event.upsert({
    where: { id: "seed-event-clinical-research" },
    update: {},
    create: {
      id: "seed-event-clinical-research",
      title: "Workshop de Investigação Clínica",
      date: "2026-07-03",
      time: "14:30",
      location: "Terceira,PT",
      description: "Oficina prática para estudantes e profissionais de saúde.",
      createdById: admin.id
    }
  });

  await prisma.newsletterSubscription.upsert({
    where: { email: "newsletter@caca.uac.pt" },
    update: {},
    create: {
      email: "newsletter@caca.uac.pt"
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
