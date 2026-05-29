import { test, expect, type Page } from "@playwright/test";

const API = "http://localhost:3333/api";

const adminUser = {
  id: "seed-admin-id",
  name: "Administrador CACA",
  email: "admin@caca.uac.pt",
  role: "ADMIN" as const,
  institution: "Centro Académico Clínico dos Açores",
  bio: null,
  avatarUrl: null
};

const regularUser = {
  id: "regular-user-id",
  name: "Utilizador Normal",
  email: "user@caca.uac.pt",
  role: "USER" as const,
  institution: null,
  bio: null,
  avatarUrl: null
};

const usersList = [adminUser, regularUser];

async function mockCurrentUser(page: Page, user: typeof adminUser | typeof regularUser) {
  await page.route(`${API}/users/me`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user })
    })
  );
}

async function setAuthSession(page: Page, user: typeof adminUser | typeof regularUser) {
  await page.addInitScript(({ u }) => {
    localStorage.setItem("caca_auth_token", "fake.header.sig");
    localStorage.setItem("caca_auth_user", JSON.stringify(u));
  }, { u: user });
}

const emptyMeta = { page: 1, limit: 6, total: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false };

async function mockUsersList(page: Page) {
  await page.route(`${API}/users*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ users: usersList, meta: { ...emptyMeta, total: usersList.length } })
    })
  );
}

test.describe("Painel de Administração — página /admin", () => {
  test("utilizador não autenticado é redirecionado para /login", async ({ page }) => {
    // Store a fake token so getCurrentUser() makes the HTTP request (instead of throwing
    // synchronously when there is no token). The mocked 401 then triggers the redirect.
    await page.addInitScript(() => {
      localStorage.setItem("caca_auth_token", "fake.header.sig");
    });

    await page.route(`${API}/users/me`, (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Não autorizado." })
      })
    );

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test("utilizador com role USER vê mensagem de acesso negado", async ({ page }) => {
    await setAuthSession(page, regularUser);
    await mockCurrentUser(page, regularUser);
    await page.goto("/admin");

    await expect(page.getByText("Não tem acesso a esta área")).toBeVisible({ timeout: 8000 });
  });

  test("administrador consegue aceder ao painel /admin", async ({ page }) => {
    await setAuthSession(page, adminUser);
    await mockCurrentUser(page, adminUser);
    await mockUsersList(page);

    await page.route(`${API}/contact*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ messages: [], meta: emptyMeta })
      })
    );
    await page.route(`${API}/newsletter*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ subscriptions: [], meta: emptyMeta })
      })
    );

    await page.goto("/admin");

    await expect(page.getByText("Administrador CACA")).toBeVisible({ timeout: 8000 });
  });

  test("painel de admin lista os utilizadores", async ({ page }) => {
    await setAuthSession(page, adminUser);
    await mockCurrentUser(page, adminUser);
    await mockUsersList(page);

    await page.route(`${API}/contact*`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ messages: [], meta: emptyMeta }) })
    );
    await page.route(`${API}/newsletter*`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ subscriptions: [], meta: emptyMeta }) })
    );

    await page.goto("/admin");

    await expect(page.getByText(adminUser.email)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(regularUser.email)).toBeVisible({ timeout: 8000 });
  });

  test("painel de admin tem elemento main", async ({ page }) => {
    await setAuthSession(page, adminUser);
    await mockCurrentUser(page, adminUser);
    await mockUsersList(page);

    await page.route(`${API}/contact*`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ messages: [], meta: emptyMeta }) })
    );
    await page.route(`${API}/newsletter*`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ subscriptions: [], meta: emptyMeta }) })
    );

    await page.goto("/admin");
    await expect(page.locator("main")).toBeVisible();
  });

  test("perfil — utilizador autenticado vê o perfil em /perfil", async ({ page }) => {
    await setAuthSession(page, adminUser);
    await mockCurrentUser(page, adminUser);

    await page.goto("/perfil");

    await expect(page.getByText(adminUser.name)).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /Terminar sessão/i })).toBeVisible();
  });

  test("perfil — utilizador pode editar o nome no formulário de perfil", async ({ page }) => {
    await setAuthSession(page, adminUser);
    await mockCurrentUser(page, adminUser);

    const updatedUser = { ...adminUser, name: "Novo Nome Admin" };
    await page.route(`${API}/users/me`, async (route) => {
      if (route.request().method() === "PUT") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ user: updatedUser })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ user: adminUser })
        });
      }
    });

    await page.goto("/perfil");

    await expect(page.locator("#name")).toBeVisible({ timeout: 8000 });
    await page.locator("#name").fill("Novo Nome Admin");
    await page.getByRole("button", { name: /Guardar perfil/i }).click();

    const feedbackStatus = page.getByRole("status");
    await expect(feedbackStatus).toContainText("atualizado", { timeout: 8000 });
  });

  test("perfil — utilizador não autenticado é redirecionado para /login", async ({ page }) => {
    // Store a fake token so the HTTP request is made (otherwise getCurrentUser() throws
    // synchronously before any fetch, and the redirect never happens).
    await page.addInitScript(() => {
      localStorage.setItem("caca_auth_token", "fake.header.sig");
    });

    await page.route(`${API}/users/me`, (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Não autorizado." })
      })
    );

    await page.goto("/perfil");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
