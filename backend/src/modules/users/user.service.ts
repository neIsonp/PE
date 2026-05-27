import { Prisma, type PrismaClient } from "@prisma/client";
import { AppError } from "../../shared/app-error.js";
import type { UserRole } from "../../shared/roles.js";
import { toPublicUser } from "./user.mapper.js";
import type { UpdateProfileInput } from "./user.schemas.js";

function normalizeNullableText(value?: string | null) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
}

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
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: {
          name: input.name,
          bio: normalizeNullableText(input.bio),
          institution: normalizeNullableText(input.institution),
          avatarUrl: normalizeNullableText(input.avatarUrl)
        }
      });

      return toPublicUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "Utilizador não encontrado.");
      }

      throw error;
    }
  }

  async updateRole(id: string, role: UserRole) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { role }
      });

      return toPublicUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new AppError(404, "Utilizador não encontrado.");
      }

      throw error;
    }
  }
}
