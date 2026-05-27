import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env.js";
import { AppError } from "../shared/app-error.js";
import type { UserRole } from "../shared/roles.js";

export type AuthenticatedUser = {
  sub: string;
  email: string;
  role: UserRole;
};

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AuthenticatedUser;
    user: AuthenticatedUser;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN
    }
  });

  app.decorate("authenticate", async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new AppError(401, "Sessão inválida ou expirada.");
    }

    const user = await app.prisma.user.findUnique({
      where: { id: request.user.sub },
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      throw new AppError(401, "Sessão inválida ou expirada.");
    }

    request.user = {
      sub: user.id,
      email: user.email,
      role: user.role
    };
  });
});
