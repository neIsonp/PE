import type { PrismaClient } from "@prisma/client";
import { AppError } from "../../shared/app-error.js";
import type { UserRole } from "../../shared/roles.js";
import { toPublicUser } from "./user.mapper.js";
import type { updateProfileBodySchema } from "./user.schemas.js";
import type { z } from "zod";

type UpdateProfileInput = z.infer<typeof updateProfileBodySchema>;

export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    });

    return users.map(toPublicUser);
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new AppError(404, "Utilizador não encontrado.");
    }

    return toPublicUser(user);
  }

  async updateProfile(id: string, input: UpdateProfileInput) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: input.name,
        bio: input.bio ?? null,
        institution: input.institution ?? null
      }
    });

    return toPublicUser(user);
  }

  async updateRole(id: string, role: UserRole) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { role }
    });

    return toPublicUser(user);
  }
}
