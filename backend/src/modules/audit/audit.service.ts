import { Prisma, type AuditAction, type PrismaClient } from "@prisma/client";
import type { FastifyRequest } from "fastify";

type AuditMetadata = Record<string, string | number | boolean | null>;

type AuditInput = {
  actorId?: string | null;
  actorEmail?: string | null;
  targetId?: string | null;
  targetType?: string | null;
  metadata?: AuditMetadata;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export class AuditService {
  constructor(private readonly prisma: PrismaClient) {}

  async record(action: AuditAction, input: AuditInput) {
    await this.prisma.auditLog.create({
      data: {
        action,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        targetId: input.targetId ?? null,
        targetType: input.targetType ?? null,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonObject) : undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null
      }
    });
  }
}

export function getAuditRequestContext(request: FastifyRequest) {
  const userAgent = request.headers["user-agent"];

  return {
    ipAddress: request.ip,
    userAgent: Array.isArray(userAgent) ? (userAgent[0] ?? null) : (userAgent ?? null)
  };
}
