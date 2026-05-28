import { Prisma, type PrismaClient } from "@prisma/client";
import { AppError } from "../../shared/app-error.js";
import type { UserRole } from "../../shared/roles.js";
import { toPublicUser } from "./user.mapper.js";
import type { UpdateProfileInput, UsersListQuery } from "./user.schemas.js";

function normalizeNullableText(value?: string | null) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
}

function makeMeta(page: number, limit: number, total: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}

export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  async listUsers(query: UsersListQuery) {
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } }
          ]
        }
      : {};
    const skip = (query.page - 1) * query.limit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      users: users.map(toPublicUser),
      meta: makeMeta(query.page, query.limit, total)
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
