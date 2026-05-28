import { randomUUID } from "node:crypto";
import Fastify, { type FastifyReply } from "fastify";
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
import { Prisma } from "@prisma/client";
import { z, ZodError } from "zod";
import { env } from "./config/env.js";
import { authPlugin } from "./plugins/auth.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { communicationRoutes } from "./modules/communications/communication.routes.js";
import { eventRoutes } from "./modules/events/event.routes.js";
import { userRoutes } from "./modules/users/user.routes.js";
import { AppError } from "./shared/app-error.js";

const requestIdHeader = "x-request-id";
const requestStartTimes = new WeakMap<object, number>();
const liveResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.string()
});
const readyResponseSchema = z.object({
  status: z.enum(["ok", "error"]),
  service: z.string(),
  database: z.enum(["ok", "unavailable"])
});

function getAllowedOrigins() {
  return env.FRONTEND_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export async function buildApp() {
  const app = Fastify({
    genReqId: (request) => {
      const requestId = request.headers[requestIdHeader];

      return Array.isArray(requestId) ? (requestId[0] ?? randomUUID()) : (requestId ?? randomUUID());
    },
    logger: env.NODE_ENV === "test" ? false : { level: env.NODE_ENV === "production" ? "info" : "debug" }
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet);
  await app.register(cors, {
    origin: getAllowedOrigins(),
    credentials: true
  });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW
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

  app.addHook("onRequest", async (request, reply) => {
    requestStartTimes.set(request, performance.now());
    reply.header(requestIdHeader, request.id);
    request.log.info({ requestId: request.id, method: request.method, url: request.url }, "Request started");
  });

  app.addHook("onResponse", async (request, reply) => {
    const startTime = requestStartTimes.get(request);
    const durationMs = startTime ? Math.round(performance.now() - startTime) : undefined;

    request.log.info(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        durationMs
      },
      "Request completed"
    );
  });

  app.get(
    "/live",
    {
      schema: {
        tags: ["system"],
        response: {
          200: liveResponseSchema
        }
      }
    },
    async () => ({
      status: "ok" as const,
      service: "caca-backend"
    })
  );

  async function checkReadiness(reply: FastifyReply) {
    try {
      await app.prisma.$queryRaw`SELECT 1`;

      return {
        status: "ok" as const,
        service: "caca-backend",
        database: "ok" as const
      };
    } catch {
      return reply.status(503).send({
        status: "error" as const,
        service: "caca-backend",
        database: "unavailable" as const
      });
    }
  }

  app.get(
    "/ready",
    {
      schema: {
        tags: ["system"],
        response: {
          200: readyResponseSchema,
          503: readyResponseSchema
        }
      }
    },
    async (_request, reply) => checkReadiness(reply)
  );

  app.get(
    "/health",
    {
      schema: {
        tags: ["system"],
        response: {
          200: readyResponseSchema,
          503: readyResponseSchema
        }
      }
    },
    async (_request, reply) => checkReadiness(reply)
  );

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(userRoutes, { prefix: "/api/users" });
  await app.register(eventRoutes, { prefix: "/api/events" });
  await app.register(communicationRoutes, { prefix: "/api" });

  app.setNotFoundHandler((request, reply) => {
    request.log.debug({ url: request.url }, "Route not found");

    return reply.status(404).send({ message: "Recurso não encontrado.", requestId: request.id });
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message, requestId: request.id });
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        message: "Pedido inválido.",
        requestId: request.id,
        details: error.validation
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: "Dados inválidos.",
        requestId: request.id,
        details: error.flatten()
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return reply.status(409).send({
          message: "Já existe um registo com estes dados.",
          requestId: request.id
        });
      }

      if (error.code === "P2025") {
        return reply.status(404).send({ message: "Registo não encontrado.", requestId: request.id });
      }
    }

    return reply.status(500).send({
      message: "Erro interno do servidor.",
      requestId: request.id
    });
  });

  return app;
}
