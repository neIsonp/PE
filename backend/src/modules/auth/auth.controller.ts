import { AuditAction } from "@prisma/client";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthenticatedUser } from "../../plugins/auth.js";
import { getAuditRequestContext, type AuditService } from "../audit/audit.service.js";
import type { PublicUser } from "../users/user.schemas.js";
import type { AuthService } from "./auth.service.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

type RegisterRequest = FastifyRequest<{ Body: RegisterInput }>;
type LoginRequest = FastifyRequest<{ Body: LoginInput }>;

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
    private readonly signToken: (payload: AuthenticatedUser) => string
  ) {}

  async register(request: RegisterRequest, reply: FastifyReply) {
    const user = await this.authService.register(request.body);

    await this.auditService.record(AuditAction.AUTH_REGISTER, {
      actorId: user.id,
      actorEmail: user.email,
      targetId: user.id,
      targetType: "USER",
      metadata: {
        role: user.role,
        institution: user.institution
      },
      ...getAuditRequestContext(request)
    });

    return reply.code(201).send(this.createAuthResponse(user));
  }

  async login(request: LoginRequest) {
    try {
      const user = await this.authService.validateLogin(request.body);

      await this.auditService.record(AuditAction.AUTH_LOGIN_SUCCESS, {
        actorId: user.id,
        actorEmail: user.email,
        targetId: user.id,
        targetType: "USER",
        ...getAuditRequestContext(request)
      });

      return this.createAuthResponse(user);
    } catch (error) {
      await this.auditService.record(AuditAction.AUTH_LOGIN_FAILURE, {
        actorEmail: request.body.email,
        targetType: "USER",
        metadata: {
          email: request.body.email
        },
        ...getAuditRequestContext(request)
      });

      throw error;
    }
  }

  private createAuthResponse(user: PublicUser) {
    const token = this.signToken({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    return { user, token };
  }
}
