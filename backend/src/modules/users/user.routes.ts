import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { errorResponseSchema } from "../../shared/zod.js";
import { AuditService } from "../audit/audit.service.js";
import { UserController } from "./user.controller.js";
import { UserService } from "./user.service.js";
import {
  updateProfileBodySchema,
  updateRoleBodySchema,
  userIdParamsSchema,
  userResponseSchema,
  usersListResponseSchema
} from "./user.schemas.js";

export async function userRoutes(app: FastifyInstance) {
  const routes = app.withTypeProvider<ZodTypeProvider>();
  const userService = new UserService(app.prisma);
  const auditService = new AuditService(app.prisma);
  const userController = new UserController(userService, auditService);

  routes.get(
    "/me",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["users"],
        security: [{ bearerAuth: [] }],
        response: {
          200: userResponseSchema,
          401: errorResponseSchema
        }
      }
    },
    (request) => userController.getMe(request)
  );

  routes.put(
    "/me",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["users"],
        security: [{ bearerAuth: [] }],
        body: updateProfileBodySchema,
        response: {
          200: userResponseSchema,
          401: errorResponseSchema,
          404: errorResponseSchema
        }
      }
    },
    (request) => userController.updateMe(request)
  );

  routes.get(
    "/",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["users"],
        security: [{ bearerAuth: [] }],
        response: {
          200: usersListResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema
        }
      }
    },
    (request) => userController.listUsers(request)
  );

  routes.patch(
    "/:id/role",
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ["users"],
        security: [{ bearerAuth: [] }],
        params: userIdParamsSchema,
        body: updateRoleBodySchema,
        response: {
          200: userResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema,
          404: errorResponseSchema
        }
      }
    },
    (request) => userController.updateRole(request)
  );
}
