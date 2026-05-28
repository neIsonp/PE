import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { env } from "../../config/env.js";
import { errorResponseSchema } from "../../shared/zod.js";
import { CommunicationController } from "./communication.controller.js";
import { CommunicationService } from "./communication.service.js";
import {
  contactMessageBodySchema,
  contactMessageParamsSchema,
  contactMessageResponseSchema,
  contactMessagesListQuerySchema,
  contactMessagesListResponseSchema,
  newsletterBodySchema,
  newsletterSubscriptionResponseSchema,
  newsletterSubscriptionsListQuerySchema,
  newsletterSubscriptionsListResponseSchema,
  updateContactMessageStatusBodySchema
} from "./communication.schemas.js";

export async function communicationRoutes(app: FastifyInstance) {
  const routes = app.withTypeProvider<ZodTypeProvider>();
  const communicationService = new CommunicationService(app.prisma);
  const communicationController = new CommunicationController(communicationService);

  routes.post(
    "/contact",
    {
      config: {
        rateLimit: {
          max: env.PUBLIC_FORM_RATE_LIMIT_MAX,
          timeWindow: env.RATE_LIMIT_WINDOW
        }
      },
      schema: {
        tags: ["communications"],
        body: contactMessageBodySchema,
        response: {
          201: contactMessageResponseSchema,
          400: errorResponseSchema
        }
      }
    },
    (request, reply) => communicationController.createContactMessage(request, reply)
  );

  routes.get(
    "/contact",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["communications"],
        security: [{ bearerAuth: [] }],
        querystring: contactMessagesListQuerySchema,
        response: {
          200: contactMessagesListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema
        }
      }
    },
    (request) => communicationController.listContactMessages(request)
  );

  routes.patch(
    "/contact/:id/status",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["communications"],
        security: [{ bearerAuth: [] }],
        params: contactMessageParamsSchema,
        body: updateContactMessageStatusBodySchema,
        response: {
          200: contactMessageResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema
        }
      }
    },
    (request) => communicationController.updateContactMessageStatus(request)
  );

  routes.post(
    "/newsletter",
    {
      config: {
        rateLimit: {
          max: env.PUBLIC_FORM_RATE_LIMIT_MAX,
          timeWindow: env.RATE_LIMIT_WINDOW
        }
      },
      schema: {
        tags: ["communications"],
        body: newsletterBodySchema,
        response: {
          201: newsletterSubscriptionResponseSchema,
          409: errorResponseSchema
        }
      }
    },
    (request, reply) => communicationController.subscribeNewsletter(request, reply)
  );

  routes.get(
    "/newsletter",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["communications"],
        security: [{ bearerAuth: [] }],
        querystring: newsletterSubscriptionsListQuerySchema,
        response: {
          200: newsletterSubscriptionsListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema
        }
      }
    },
    (request) => communicationController.listNewsletterSubscriptions(request)
  );
}
