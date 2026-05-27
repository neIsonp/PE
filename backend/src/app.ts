import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import {
  hasZodFastifySchemaValidationErrors,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler
} from "fastify-type-provider-zod";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { authPlugin } from "./plugins/auth.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { userRoutes } from "./modules/users/user.routes.js";
import { AppError } from "./shared/app-error.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug"
    }
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet);
  await app.register(cors, {
    origin: env.FRONTEND_ORIGIN,
    credentials: true
  });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute"
  });
  await app.register(swagger, {
    openapi: {
      info: {
        title: "CACA User Management API",
        description: "API de registo, autenticação e perfis do CACA.",
        version: "1.0.0"
      },
      servers: [{ url: `http://localhost:${env.PORT}` }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT"
          }
        }
      }
    },
    transform: jsonSchemaTransform
  });
  await app.register(swaggerUi, {
    routePrefix: "/docs"
  });
  await app.register(prismaPlugin);
  await app.register(authPlugin);

  app.get("/health", async () => ({
    status: "ok",
    service: "caca-backend"
  }));

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(userRoutes, { prefix: "/api/users" });

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        message: "Pedido inválido.",
        details: error.validation
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: "Dados inválidos.",
        details: error.flatten()
      });
    }

    return reply.status(500).send({
      message: "Erro interno do servidor."
    });
  });

  return app;
}
