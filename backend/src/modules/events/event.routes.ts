import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { errorResponseSchema } from "../../shared/zod.js";
import { AuditService } from "../audit/audit.service.js";
import { EventController } from "./event.controller.js";
import { EventService } from "./event.service.js";
import {
  eventBodySchema,
  eventParamsSchema,
  eventResponseSchema,
  eventsListResponseSchema
} from "./event.schemas.js";

export async function eventRoutes(app: FastifyInstance) {
  const routes = app.withTypeProvider<ZodTypeProvider>();
  const eventService = new EventService(app.prisma);
  const auditService = new AuditService(app.prisma);
  const eventController = new EventController(eventService, auditService);

  routes.get(
    "/",
    {
      schema: {
        tags: ["events"],
        response: {
          200: eventsListResponseSchema
        }
      }
    },
    () => eventController.listEvents()
  );

  routes.get(
    "/:id",
    {
      schema: {
        tags: ["events"],
        params: eventParamsSchema,
        response: {
          200: eventResponseSchema,
          404: errorResponseSchema
        }
      }
    },
    (request) => eventController.getEvent(request)
  );

  routes.post(
    "/",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["events"],
        security: [{ bearerAuth: [] }],
        body: eventBodySchema,
        response: {
          201: eventResponseSchema,
          401: errorResponseSchema
        }
      }
    },
    (request, reply) => eventController.createEvent(request, reply)
  );

  routes.put(
    "/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["events"],
        security: [{ bearerAuth: [] }],
        params: eventParamsSchema,
        body: eventBodySchema,
        response: {
          200: eventResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema
        }
      }
    },
    (request) => eventController.updateEvent(request)
  );

  routes.delete(
    "/:id",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["events"],
        security: [{ bearerAuth: [] }],
        params: eventParamsSchema,
        response: {
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema
        }
      }
    },
    (request, reply) => eventController.deleteEvent(request, reply)
  );
}
