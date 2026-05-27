import type { FastifyRequest } from "fastify";
import { AppError } from "../../shared/app-error.js";
import { assertRole } from "../../shared/authorization.js";
import type { UserService } from "./user.service.js";
import type { UpdateProfileInput, UpdateRoleInput, UserIdParams } from "./user.schemas.js";

type UpdateProfileRequest = FastifyRequest<{ Body: UpdateProfileInput }>;
type UpdateRoleRequest = FastifyRequest<{ Params: UserIdParams; Body: UpdateRoleInput }>;

export class UserController {
  constructor(private readonly userService: UserService) {}

  async getMe(request: FastifyRequest) {
    const user = await this.userService.getUserById(request.user.sub);

    return { user };
  }

  async updateMe(request: UpdateProfileRequest) {
    const user = await this.userService.updateProfile(request.user.sub, request.body);

    return { user };
  }

  async listUsers(request: FastifyRequest) {
    assertRole(request.user.role, ["ADMIN"], "Apenas administradores podem listar utilizadores.");

    const users = await this.userService.listUsers();

    return { users };
  }

  async updateRole(request: UpdateRoleRequest) {
    assertRole(request.user.role, ["ADMIN"], "Apenas administradores podem alterar permissões.");

    if (request.params.id === request.user.sub && request.body.role !== "ADMIN") {
      throw new AppError(400, "Não é possível remover a própria permissão de administrador.");
    }

    const user = await this.userService.updateRole(request.params.id, request.body.role);

    return { user };
  }
}
