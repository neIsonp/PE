import { test, expect, type Page } from "@playwright/test";

const API = "**/api";

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
  await page.route(`${API}/events**`, async (route) => {
    if (route.request().method() === "OPTIONS") {
      return route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }
    if (route.request().method() !== "GET") {
      return route.fallback();
    }
    return route.fulfill({
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      contentType: "application/json",
      body: JSON.stringify({ events: seedEvents })
    });
  });
}

async function setAuthSession(page: Page) {
  await page.addInitScript(({ user }) => {
    document.cookie = "caca_auth_token=fake.header.sig; path=/";
    localStorage.setItem("caca_auth_user", JSON.stringify(user));
  }, { user: adminUser });
}

test.describe("Gestão de Eventos — página /eventos e /perfil", () => {
  test("visitante não autenticado vê a lista de eventos em /eventos", async ({ page }) => {
    await mockGetEvents(page);
    await page.goto("/eventos");

    const heading = page.getByRole("heading", { name: "Próximos Eventos" });
    await expect(heading).toBeVisible();

    // The form is not on this page anymore, we just check the events are listed
    for (const event of seedEvents) {
      await expect(page.getByText(event.title)).toBeVisible();
    }
  });

  test("visitante não autenticado vê call to action para login em /eventos", async ({ page }) => {
    await mockGetEvents(page);
    await page.goto("/eventos");

    const ctaLink = page.getByRole("link", { name: "Saber Mais" });
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveAttribute("href", "/login");
  });

  test("utilizador autenticado pode criar um evento via /perfil", async ({ page }) => {
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

    await page.route(`${API}/users/me`, async (route) => {
      if (route.request().method() === "OPTIONS") {
        return route.fulfill({
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
        });
      }
      return route.fulfill({
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        contentType: "application/json",
        body: JSON.stringify({ user: adminUser })
      });
    });

    // Mocks for events in the profile
    await page.route(`${API}/events**`, async (route) => {
      if (route.request().method() === "OPTIONS") {
        await route.fulfill({
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
        });
      } else if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          headers: { "Access-Control-Allow-Origin": "*" },
          contentType: "application/json",
          body: JSON.stringify({ event: newEvent })
        });
      } else {
        await route.fulfill({
          status: 200,
          headers: { "Access-Control-Allow-Origin": "*" },
          contentType: "application/json",
          body: JSON.stringify({ events: seedEvents })
        });
      }
    });

    await page.goto("/perfil");

    // Navigate to Events tab
    await page.getByRole("button", { name: "Meus eventos" }).click();

    // Click + Adicionar to open the modal
    await page.getByRole("button", { name: "+ Adicionar" }).click();

    await expect(page.locator("#event-form fieldset")).not.toBeDisabled({ timeout: 5000 });

    await page.locator("#event-title").fill(newEvent.title);
    await page.locator("#event-date").fill(newEvent.date);
    await page.locator("#event-time").fill(newEvent.time);
    
    // Correct label from src/data/events.ts: value "Ponta Delgada,PT" → label "Ilha de São Miguel"
    // Wait! The form uses coordinates via map, and the description text area.
    // Wait, the test uses `#event-location`, but we removed the Select and added a Map for exact locations!
    // The previous test logic used `#event-location`, but our `EventForm` has:
    // `#event-latitude`, `#event-longitude`, `#event-venue`. Let's use those!
    await page.locator("#event-venue").fill("Local exato de teste");
    await page.locator("#event-latitude").fill("38.5");
    await page.locator("#event-longitude").fill("-28.0");
    await page.locator("#event-description").fill(newEvent.description);
    
    await page.locator("#btn-save-event").click();

    const feedbackStatus = page.locator('.form-feedback[role="status"]').last();
    await expect(feedbackStatus).toContainText("Evento criado");
  });

  test("utilizador autenticado pode eliminar um evento em /perfil", async ({ page }) => {
    await setAuthSession(page);
    await mockGetEvents(page);
    
    await page.route(`${API}/users/me`, async (route) => {
      if (route.request().method() === "OPTIONS") {
        return route.fulfill({
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
        });
      }
      return route.fulfill({
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        contentType: "application/json",
        body: JSON.stringify({ user: adminUser })
      });
    });

    await page.route(`${API}/events/${seedEvents[0]!.id}`, async (route) => {
      if (route.request().method() === "OPTIONS") {
        return route.fulfill({
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
        });
      }
      return route.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*" } });
    });

    await page.goto("/perfil");
    
    // Navigate to Events tab
    await page.getByRole("button", { name: "Meus eventos" }).click();

    await page.getByRole("button", { name: /eliminar/i }).first().click();

    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible" });
    await dialog.getByRole("button", { name: "Eliminar" }).click();

    const feedbackStatus = page.locator('.form-feedback[role="status"]').last();
    await expect(feedbackStatus).toContainText("eliminado");
  });

  test("utilizador autenticado vê botões de editar e eliminar nos eventos em /perfil", async ({ page }) => {
    await setAuthSession(page);
    await mockGetEvents(page);
    
    await page.route(`${API}/users/me`, async (route) => {
      if (route.request().method() === "OPTIONS") {
        return route.fulfill({
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
        });
      }
      return route.fulfill({
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        contentType: "application/json",
        body: JSON.stringify({ user: adminUser })
      });
    });

    await page.goto("/perfil");

    // Navigate to Events tab
    await page.getByRole("button", { name: "Meus eventos" }).click();

    const editButtons = page.getByRole("button", { name: /editar/i });
    const deleteButtons = page.getByRole("button", { name: /eliminar/i });

    await expect(editButtons.first()).toBeVisible();
    await expect(deleteButtons.first()).toBeVisible();
  });

  test("página /eventos tem elemento main", async ({ page }) => {
    await mockGetEvents(page);
    await page.goto("/eventos");
    await expect(page.locator("main").first()).toBeVisible();
  });
});
