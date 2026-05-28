import { Prisma, type PrismaClient } from "@prisma/client";
import { AppError } from "../../shared/app-error.js";
import { buildPaginationMeta } from "../../shared/pagination.js";
import type { UserRole } from "../../shared/roles.js";
import { toPublicUser } from "./user.mapper.js";
import type { UpdateProfileInput, UsersListQuery } from "./user.schemas.js";

function normalizeNullableText(value?: string | null) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
}

export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  async listUsers(query: UsersListQuery) {
    const page = query.page;
    const limit = query.limit;
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput | undefined = search
      ? {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } }
          ]
        }
      : undefined;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      users: users.map(toPublicUser),
      meta: buildPaginationMeta({ page, limit, total })
    };
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
