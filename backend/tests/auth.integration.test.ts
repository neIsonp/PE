import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { buildApp } from "../src/app.js";

type TestApp = Awaited<ReturnType<typeof buildApp>>;
type AuthBody = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "USER";
    institution: string | null;
    bio: string | null;
    avatarUrl: string | null;
  };
};

let app: TestApp;

function resetDatabase() {
  const backendRoot = fileURLToPath(new URL("..", import.meta.url));

  execSync("npx prisma migrate reset --force --skip-seed --skip-generate", {
    cwd: backendRoot,
    env: process.env,
    stdio: "pipe"
  });
}

async function registerUser(email: string) {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: {
      name: "Maria Silva",
      email,
      password: "Senha2026",
      institution: "Universidade dos Açores"
    }
  });

  return {
    response,
    body: JSON.parse(response.body) as AuthBody
  };
}

describe("auth, users, events and communications API", () => {
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgresql://caca:caca@localhost:5433/caca_test?schema=public";
    process.env.JWT_SECRET = "test-secret-with-more-than-thirty-two-characters";
    process.env.FRONTEND_ORIGIN = "http://localhost:3000";
    process.env.BCRYPT_SALT_ROUNDS = "10";

    resetDatabase();

    const module = await import("../src/app.js");
    app = await module.buildApp();
    await app.ready();
  });

  beforeEach(async () => {
    await app.prisma.auditLog.deleteMany();
    await app.prisma.newsletterSubscription.deleteMany();
    await app.prisma.contactMessage.deleteMany();
    await app.prisma.event.deleteMany();
    await app.prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("expõe endpoints de vida e prontidão com base de dados ativa", async () => {
    const liveResponse = await app.inject({
      method: "GET",
      url: "/live"
    });
    const readyResponse = await app.inject({
      method: "GET",
      url: "/ready"
    });
    const healthResponse = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(liveResponse.statusCode).toBe(200);
    expect(readyResponse.statusCode).toBe(200);
    expect(healthResponse.statusCode).toBe(200);
    expect(JSON.parse(readyResponse.body)).toMatchObject({ database: "ok" });
  });

  it("regista, autentica e atualiza o perfil de um utilizador", async () => {
    const email = `maria-${randomUUID()}@caca.pt`;
    const { response: registerResponse, body: registerBody } = await registerUser(email);

    expect(registerResponse.statusCode).toBe(201);
    expect(registerBody.token).toBeTypeOf("string");
    expect(registerBody.user.email).toBe(email);
    expect(registerBody.user).not.toHaveProperty("passwordHash");

    const loginResponse = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email,
        password: "Senha2026"
      }
    });
    const loginBody = JSON.parse(loginResponse.body) as AuthBody;

    expect(loginResponse.statusCode).toBe(200);
    expect(loginBody.token).toBeTypeOf("string");

    const failedLoginResponse = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email,
        password: "SenhaErrada2026"
      }
    });

    expect(failedLoginResponse.statusCode).toBe(401);

    const profileResponse = await app.inject({
      method: "PUT",
      url: "/api/users/me",
      headers: {
        authorization: `Bearer ${loginBody.token}`
      },
      payload: {
        name: "Maria Silva Atualizada",
        institution: "",
        bio: "Investigadora clínica.",
        avatarUrl: "data:image/png;base64,aW1hZ2U="
      }
    });
    const profileBody = JSON.parse(profileResponse.body) as { user: AuthBody["user"] };

    expect(profileResponse.statusCode).toBe(200);
    expect(profileBody.user.name).toBe("Maria Silva Atualizada");
    expect(profileBody.user.institution).toBeNull();
    expect(profileBody.user.bio).toBe("Investigadora clínica.");
    expect(profileBody.user.avatarUrl).toContain("data:image/png");

    const auditActions = await app.prisma.auditLog.findMany({
      where: { actorEmail: email },
      select: { action: true },
      orderBy: { createdAt: "asc" }
    });

    expect(auditActions.map((entry) => entry.action)).toEqual(
      expect.arrayContaining(["AUTH_REGISTER", "AUTH_LOGIN_SUCCESS", "AUTH_LOGIN_FAILURE"])
    );
  });

  it("protege endpoints administrativos por role", async () => {
    const email = `user-${randomUUID()}@caca.pt`;
    const { body: userBody } = await registerUser(email);

    const forbiddenResponse = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: {
        authorization: `Bearer ${userBody.token}`
      }
    });

    expect(forbiddenResponse.statusCode).toBe(403);

    const passwordHash = await bcrypt.hash("Admin2026", 10);
    await app.prisma.user.create({
      data: {
        name: "Administrador CACA",
        email: `admin-${randomUUID()}@caca.pt`,
        passwordHash,
        role: "ADMIN"
      }
    });

    const admin = await app.prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
    const adminLoginResponse = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: admin.email,
        password: "Admin2026"
      }
    });
    const adminLoginBody = JSON.parse(adminLoginResponse.body) as AuthBody;

    const usersResponse = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: {
        authorization: `Bearer ${adminLoginBody.token}`
      }
    });
    const usersBody = JSON.parse(usersResponse.body) as { users: AuthBody["user"][] };

    expect(usersResponse.statusCode).toBe(200);
    expect(usersBody.users.length).toBeGreaterThanOrEqual(2);

    const promoteResponse = await app.inject({
      method: "PATCH",
      url: `/api/users/${userBody.user.id}/role`,
      headers: {
        authorization: `Bearer ${adminLoginBody.token}`
      },
      payload: {
        role: "ADMIN"
      }
    });

    expect(promoteResponse.statusCode).toBe(200);

    const promotedUserResponse = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: {
        authorization: `Bearer ${userBody.token}`
      }
    });

    expect(promotedUserResponse.statusCode).toBe(200);

    await app.prisma.user.delete({ where: { id: userBody.user.id } });

    const deletedUserTokenResponse = await app.inject({
      method: "GET",
      url: "/api/users/me",
      headers: {
        authorization: `Bearer ${userBody.token}`
      }
    });

    expect(deletedUserTokenResponse.statusCode).toBe(401);

    const roleAudit = await app.prisma.auditLog.findFirst({
      where: {
        action: "USER_ROLE_UPDATED",
        targetId: userBody.user.id
      }
    });

    expect(roleAudit?.actorId).toBe(adminLoginBody.user.id);
  });

  it("cria, lista, atualiza e elimina eventos pela API", async () => {
    const { body } = await registerUser(`events-${randomUUID()}@caca.pt`);

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/events",
      headers: {
        authorization: `Bearer ${body.token}`
      },
      payload: {
        title: "Workshop de Saúde Digital",
        date: "2026-06-20",
        time: "10:00",
        location: "Ponta Delgada,PT",
        description: "Sessão prática."
      }
    });
    const createBody = JSON.parse(createResponse.body) as { event: { id: string; title: string } };

    expect(createResponse.statusCode).toBe(201);
    expect(createBody.event.title).toBe("Workshop de Saúde Digital");

    const updateResponse = await app.inject({
      method: "PUT",
      url: `/api/events/${createBody.event.id}`,
      headers: {
        authorization: `Bearer ${body.token}`
      },
      payload: {
        title: "Workshop de Saúde Digital Atualizado",
        date: "2026-06-21",
        time: "11:00",
        location: "Terceira,PT",
        description: ""
      }
    });

    expect(updateResponse.statusCode).toBe(200);

    const listResponse = await app.inject({
      method: "GET",
      url: "/api/events"
    });
    const listBody = JSON.parse(listResponse.body) as { events: unknown[] };

    expect(listResponse.statusCode).toBe(200);
    expect(listBody.events).toHaveLength(1);

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/api/events/${createBody.event.id}`,
      headers: {
        authorization: `Bearer ${body.token}`
      }
    });

    expect(deleteResponse.statusCode).toBe(204);

    const eventAuditActions = await app.prisma.auditLog.findMany({
      where: { targetType: "EVENT", targetId: createBody.event.id },
      select: { action: true },
      orderBy: { createdAt: "asc" }
    });

    expect(eventAuditActions.map((entry) => entry.action)).toEqual([
      "EVENT_CREATED",
      "EVENT_UPDATED",
      "EVENT_DELETED"
    ]);
  });

  it("regista mensagens de contacto e subscrições de newsletter", async () => {
    const contactResponse = await app.inject({
      method: "POST",
      url: "/api/contact",
      payload: {
        firstName: "Nelson",
        lastName: "Ponte",
        email: "nelson@example.com",
        phone: "+351 912345678",
        message: "Gostaria de saber mais sobre projetos de investigação."
      }
    });

    expect(contactResponse.statusCode).toBe(201);

    const newsletterResponse = await app.inject({
      method: "POST",
      url: "/api/newsletter",
      payload: {
        email: "newsletter@example.com"
      }
    });

    expect(newsletterResponse.statusCode).toBe(201);

    const duplicateNewsletterResponse = await app.inject({
      method: "POST",
      url: "/api/newsletter",
      payload: {
        email: "newsletter@example.com"
      }
    });

    expect(duplicateNewsletterResponse.statusCode).toBe(409);
  });
});
