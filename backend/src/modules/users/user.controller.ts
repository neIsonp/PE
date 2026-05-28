import { AuditAction } from "@prisma/client";
import type { FastifyRequest } from "fastify";
import { AppError } from "../../shared/app-error.js";
import { assertRole } from "../../shared/authorization.js";
import { getAuditRequestContext, type AuditService } from "../audit/audit.service.js";
import type { UserService } from "./user.service.js";
import type {
  UpdateProfileInput,
  UpdateRoleInput,
  UsersListQuery
} from "./user.schemas.js";

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly auditService: AuditService
  ) {}

  async getMe(request: FastifyRequest) {
    const user = await this.userService.getUserById(request.user.sub);

    return { user };
  }

  async updateMe(request: FastifyRequest) {
    const user = await this.userService.updateProfile(request.user.sub, request.body as UpdateProfileInput);

    return { user };
  }

  async listUsers(request: FastifyRequest) {
    assertRole(request.user.role, ["ADMIN"], "Apenas administradores podem listar utilizadores.");

    const result = await this.userService.listUsers(request.query as UsersListQuery);

    return result;
  }

  async updateRole(request: FastifyRequest) {
    assertRole(request.user.role, ["ADMIN"], "Apenas administradores podem alterar permissões.");
    const params = request.params as { id: string };
    const body = request.body as UpdateRoleInput;

    if (params.id === request.user.sub && body.role !== "ADMIN") {
      throw new AppError(400, "Não é possível remover a própria permissão de administrador.");
    }

    const user = await this.userService.updateRole(params.id, body.role);

    await this.auditService.record(AuditAction.USER_ROLE_UPDATED, {
      actorId: request.user.sub,
      actorEmail: request.user.email,
      targetId: user.id,
      targetType: "USER",
      metadata: {
        newRole: user.role
      },
      ...getAuditRequestContext(request)
    });

    return { user };
  }
}
