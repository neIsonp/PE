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

async function createAdminAndLogin() {
  const password = "Admin2026";
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await app.prisma.user.create({
    data: {
      name: "Administrador CACA",
      email: `admin-${randomUUID()}@caca.pt`,
      passwordHash,
      role: "ADMIN"
    }
  });

  const adminLoginResponse = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: {
      email: admin.email,
      password
    }
  });

  return {
    admin,
    body: JSON.parse(adminLoginResponse.body) as AuthBody
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

    expect(auditActions.map((entry: { action: string }) => entry.action)).toEqual(
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

    const { body: adminLoginBody } = await createAdminAndLogin();

    const usersResponse = await app.inject({
      method: "GET",
      url: "/api/users?page=1&limit=1",
      headers: {
        authorization: `Bearer ${adminLoginBody.token}`
      }
    });
    const usersBody = JSON.parse(usersResponse.body) as {
      users: AuthBody["user"][];
      meta: { page: number; limit: number; total: number; totalPages: number };
    };

    expect(usersResponse.statusCode).toBe(200);
    expect(usersBody.users).toHaveLength(1);
    expect(usersBody.meta).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2
    });

    const searchResponse = await app.inject({
      method: "GET",
      url: `/api/users?page=1&limit=10&search=${encodeURIComponent(email)}`,
      headers: {
        authorization: `Bearer ${adminLoginBody.token}`
      }
    });
    const searchBody = JSON.parse(searchResponse.body) as {
      users: AuthBody["user"][];
      meta: { total: number };
    };

    expect(searchResponse.statusCode).toBe(200);
    expect(searchBody.meta.total).toBe(1);
    expect(searchBody.users[0]?.email).toBe(email);

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
        venue: "Universidade dos Acores, Sala 2.1",
        latitude: 37.745906,
        longitude: -25.663789,
        description: "Sessão prática."
      }
    });
    const createBody = JSON.parse(createResponse.body) as {
      event: { id: string; title: string; venue: string | null; latitude: number | null; longitude: number | null };
    };

    expect(createResponse.statusCode).toBe(201);
    expect(createBody.event.title).toBe("Workshop de Saúde Digital");
    expect(createBody.event.venue).toBe("Universidade dos Acores, Sala 2.1");
    expect(createBody.event.latitude).toBe(37.745906);

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
        venue: "Hospital de Santo Espirito, Auditorio",
        latitude: 38.656031,
        longitude: -27.220575,
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

    const { body: otherUserBody } = await registerUser(`other-events-${randomUUID()}@caca.pt`);

    await app.inject({
      method: "POST",
      url: "/api/events",
      headers: {
        authorization: `Bearer ${otherUserBody.token}`
      },
      payload: {
        title: "Sessão de Outro Utilizador",
        date: "2026-08-12",
        time: "15:00",
        location: "Faial,PT",
        description: "Evento criado por outro membro."
      }
    });

    const myEventsResponse = await app.inject({
      method: "GET",
      url: "/api/events/mine?period=upcoming",
      headers: {
        authorization: `Bearer ${body.token}`
      }
    });
    const myEventsBody = JSON.parse(myEventsResponse.body) as { events: Array<{ title: string }> };

    expect(myEventsResponse.statusCode).toBe(200);
    expect(myEventsBody.events.map((event) => event.title)).toEqual([
      "Workshop de Saúde Digital Atualizado"
    ]);

    const anonymousMyEventsResponse = await app.inject({
      method: "GET",
      url: "/api/events/mine"
    });

    expect(anonymousMyEventsResponse.statusCode).toBe(401);

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

    expect(eventAuditActions.map((entry: { action: string }) => entry.action)).toEqual([
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

  it("permite a admins gerir estados de mensagens e listar dados paginados", async () => {
    const firstContactResponse = await app.inject({
      method: "POST",
      url: "/api/contact",
      payload: {
        firstName: "Ana",
        lastName: "Costa",
        email: "ana@example.com",
        phone: "+351 911111111",
        message: "Gostaria de falar sobre uma parceria institucional."
      }
    });
    const firstContactBody = JSON.parse(firstContactResponse.body) as {
      message: { id: string; status: "PENDING" | "READ" | "ARCHIVED" };
    };

    await app.inject({
      method: "POST",
      url: "/api/contact",
      payload: {
        firstName: "Bruno",
        lastName: "Silva",
        email: "bruno@example.com",
        phone: "+351 922222222",
        message: "Preciso de informacoes sobre os vossos eventos."
      }
    });

    await app.inject({
      method: "POST",
      url: "/api/newsletter",
      payload: {
        email: "newsletter-1@example.com"
      }
    });

    await app.inject({
      method: "POST",
      url: "/api/newsletter",
      payload: {
        email: "newsletter-2@example.com"
      }
    });

    const { body: userBody } = await registerUser(`member-${randomUUID()}@caca.pt`);

    const forbiddenStatusUpdateResponse = await app.inject({
      method: "PATCH",
      url: `/api/contact/${firstContactBody.message.id}/status`,
      headers: {
        authorization: `Bearer ${userBody.token}`
      },
      payload: {
        status: "READ"
      }
    });

    expect(forbiddenStatusUpdateResponse.statusCode).toBe(403);

    const { body: adminLoginBody } = await createAdminAndLogin();

    const updateStatusResponse = await app.inject({
      method: "PATCH",
      url: `/api/contact/${firstContactBody.message.id}/status`,
      headers: {
        authorization: `Bearer ${adminLoginBody.token}`
      },
      payload: {
        status: "READ"
      }
    });
    const updateStatusBody = JSON.parse(updateStatusResponse.body) as {
      message: { id: string; status: "PENDING" | "READ" | "ARCHIVED" };
    };

    expect(updateStatusResponse.statusCode).toBe(200);
    expect(updateStatusBody.message.status).toBe("READ");

    const filteredMessagesResponse = await app.inject({
      method: "GET",
      url: "/api/contact?page=1&limit=10&status=READ",
      headers: {
        authorization: `Bearer ${adminLoginBody.token}`
      }
    });
    const filteredMessagesBody = JSON.parse(filteredMessagesResponse.body) as {
      messages: Array<{ id: string; status: string }>;
      meta: { total: number; totalPages: number; hasNextPage: boolean };
    };

    expect(filteredMessagesResponse.statusCode).toBe(200);
    expect(filteredMessagesBody.messages).toHaveLength(1);
    expect(filteredMessagesBody.messages[0]?.id).toBe(firstContactBody.message.id);
    expect(filteredMessagesBody.meta).toMatchObject({
      total: 1,
      totalPages: 1,
      hasNextPage: false
    });

    const newsletterListResponse = await app.inject({
      method: "GET",
      url: "/api/newsletter?page=1&limit=1",
      headers: {
        authorization: `Bearer ${adminLoginBody.token}`
      }
    });
    const newsletterListBody = JSON.parse(newsletterListResponse.body) as {
      subscriptions: Array<{ email: string }>;
      meta: { page: number; limit: number; total: number; totalPages: number };
    };

    expect(newsletterListResponse.statusCode).toBe(200);
    expect(newsletterListBody.subscriptions).toHaveLength(1);
    expect(newsletterListBody.meta).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2
    });
  });

  it("filtra eventos passados e futuros corretamente", async () => {
    const { body } = await registerUser(`period-${randomUUID()}@caca.pt`);

    await app.inject({
      method: "POST",
      url: "/api/events",
      headers: {
        authorization: `Bearer ${body.token}`
      },
      payload: {
        title: "Evento Futuro",
        date: "2099-01-01",
        time: "09:00",
        location: "Faial,PT",
        description: "Sessao futura."
      }
    });

    await app.inject({
      method: "POST",
      url: "/api/events",
      headers: {
        authorization: `Bearer ${body.token}`
      },
      payload: {
        title: "Evento Passado",
        date: "2020-01-01",
        time: "09:00",
        location: "Pico,PT",
        description: "Sessao passada."
      }
    });

    const upcomingResponse = await app.inject({
      method: "GET",
      url: "/api/events?period=upcoming"
    });
    const upcomingBody = JSON.parse(upcomingResponse.body) as {
      events: Array<{ title: string }>;
    };

    expect(upcomingResponse.statusCode).toBe(200);
    expect(upcomingBody.events.map((event) => event.title)).toEqual(["Evento Futuro"]);

    const pastResponse = await app.inject({
      method: "GET",
      url: "/api/events?period=past"
    });
    const pastBody = JSON.parse(pastResponse.body) as {
      events: Array<{ title: string }>;
    };

    expect(pastResponse.statusCode).toBe(200);
    expect(pastBody.events.map((event) => event.title)).toEqual(["Evento Passado"]);
  });
});
