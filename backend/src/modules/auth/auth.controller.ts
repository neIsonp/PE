import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthenticatedUser } from "../../plugins/auth.js";
import type { PublicUser } from "../users/user.schemas.js";
import type { AuthService } from "./auth.service.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

type RegisterRequest = FastifyRequest<{ Body: RegisterInput }>;
type LoginRequest = FastifyRequest<{ Body: LoginInput }>;

export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly signToken: (payload: AuthenticatedUser) => string
  ) {}

  async register(request: RegisterRequest, reply: FastifyReply) {
    const user = await this.authService.register(request.body);

    return reply.code(201).send(this.createAuthResponse(user));
  }

  async login(request: LoginRequest) {
    const user = await this.authService.validateLogin(request.body);

    return this.createAuthResponse(user);
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
