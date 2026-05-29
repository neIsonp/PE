import { test, expect, type Page } from "@playwright/test";

const API = "http://localhost:3333/api";

const seedEvents = [
  {
    id: "seed-event-health-digital",
    title: "Encontro CACA de Saúde Digital",
    date: "2026-06-12",
    time: "10:00",
    location: "Ponta Delgada,PT",
    description: "Sessão de partilha sobre plataformas digitais.",
    createdById: "seed-admin-id",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "seed-event-clinical-research",
    title: "Workshop de Investigação Clínica",
    date: "2026-07-03",
    time: "14:30",
    location: "Terceira,PT",
    description: "Oficina prática para estudantes e profissionais.",
    createdById: "seed-admin-id",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  }
];

const adminUser = {
  id: "seed-admin-id",
  name: "Administrador CACA",
  email: "admin@caca.uac.pt",
  role: "ADMIN" as const,
  institution: "Centro Académico Clínico dos Açores",
  bio: null,
  avatarUrl: null
};

async function mockGetEvents(page: Page) {
  await page.route(`${API}/events*`, (route) => {
    if (route.request().method() !== "GET") {
      return route.fallback();
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ events: seedEvents })
    });
  });
}

async function setAuthSession(page: Page) {
  await page.addInitScript(({ user }) => {
    localStorage.setItem("caca_auth_token", "fake.header.sig");
    localStorage.setItem("caca_auth_user", JSON.stringify(user));
  }, { user: adminUser });
}

test.describe("Gestão de Eventos — página /eventos", () => {
  test("visitante não autenticado vê a lista de eventos mas o formulário está desativado", async ({ page }) => {
    await mockGetEvents(page);
    await page.goto("/eventos");

    const heading = page.getByRole("heading", { name: "Gestão de Eventos" });
    await expect(heading).toBeVisible();

    await expect(page.locator("#event-form fieldset")).toBeDisabled();

    for (const event of seedEvents) {
      await expect(page.getByText(event.title)).toBeVisible();
    }
  });

  test("visitante não autenticado vê aviso de que precisa de iniciar sessão", async ({ page }) => {
    await mockGetEvents(page);
    await page.goto("/eventos");

    await expect(page.getByRole("note")).toContainText("iniciar sessão");
  });

  test("utilizador autenticado pode criar um evento", async ({ page }) => {
    await setAuthSession(page);

    const newEvent = {
      id: "new-event-id",
      title: "Novo Evento de Teste E2E",
      date: "2026-09-15",
      time: "09:00",
      location: "Ponta Delgada,PT",
      description: "Evento criado nos testes E2E.",
      createdById: "seed-admin-id",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z"
    };

    // Single route handler for both GET and POST
    await page.route(`${API}/events*`, async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ event: newEvent })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ events: seedEvents })
        });
      }
    });

    await page.goto("/eventos");

    await expect(page.locator("#event-form fieldset")).not.toBeDisabled({ timeout: 5000 });

    await page.locator("#event-title").fill(newEvent.title);
    await page.locator("#event-date").fill(newEvent.date);
    await page.locator("#event-time").fill(newEvent.time);
    // Correct label from src/data/events.ts: value "Ponta Delgada,PT" → label "Ilha de São Miguel"
    await page.locator("#event-location").selectOption({ label: "Ilha de São Miguel" });
    await page.locator("#event-description").fill(newEvent.description);
    await page.locator("#btn-save-event").click();

    const feedbackStatus = page.locator('[role="status"]').last();
    await expect(feedbackStatus).toContainText("Evento criado");
  });

  test("utilizador autenticado pode eliminar um evento", async ({ page }) => {
    await setAuthSession(page);
    await mockGetEvents(page);

    await page.route(`${API}/events/${seedEvents[0]!.id}`, (route) =>
      route.fulfill({ status: 204 })
    );

    await page.goto("/eventos");

    await page.getByRole("button", { name: /eliminar/i }).first().click();

    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible" });
    await dialog.getByRole("button", { name: "Eliminar" }).click();

    const feedbackStatus = page.locator('[role="status"]').last();
    await expect(feedbackStatus).toContainText("eliminado");
  });

  test("utilizador autenticado vê botões de editar e eliminar nos eventos", async ({ page }) => {
    await setAuthSession(page);
    await mockGetEvents(page);
    await page.goto("/eventos");

    const editButtons = page.getByRole("button", { name: /editar/i });
    const deleteButtons = page.getByRole("button", { name: /eliminar/i });

    await expect(editButtons.first()).toBeVisible();
    await expect(deleteButtons.first()).toBeVisible();
  });

  test("página /eventos tem elemento main", async ({ page }) => {
    await mockGetEvents(page);
    await page.goto("/eventos");
    await expect(page.locator("main")).toBeVisible();
  });
});
