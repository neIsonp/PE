import { Prisma, type PrismaClient } from "@prisma/client";
import { AppError } from "../../shared/app-error.js";
import { hashPassword, verifyPassword } from "../../shared/password.js";
import { toPublicUser } from "../users/user.mapper.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async register(input: RegisterInput) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existingUser) {
      throw new AppError(409, "Já existe um utilizador com este email.");
    }

    const passwordHash = await hashPassword(input.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          institution: input.institution?.trim() || null
        }
      });

      return toPublicUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError(409, "Já existe um utilizador com este email.");
      }

      throw error;
    }
  }

  async validateLogin(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user) {
      throw new AppError(401, "Credenciais inválidas.");
    }

    const isValidPassword = await verifyPassword(input.password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError(401, "Credenciais inválidas.");
    }

    return toPublicUser(user);
  }
}
