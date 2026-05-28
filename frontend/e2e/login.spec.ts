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

async function mockSuccessfulLogin(page: Page) {
  await page.route(`${API}/auth/login`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ token: "fake.header.sig", user: adminUser })
    })
  );

  await page.route(`${API}/users/me`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: adminUser })
    })
  );
}

test.describe("Autenticação — página /login", () => {
  test("renderiza o formulário de login com campos e botão", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  test("login com credenciais válidas redireciona para /perfil", async ({ page }) => {
    await mockSuccessfulLogin(page);

    await page.goto("/login");
    await page.locator("#email").fill("admin@caca.uac.pt");
    await page.locator("#password").fill("AdminCACA2026!");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/perfil/);
  });

  test("login com credenciais inválidas mostra mensagem de erro", async ({ page }) => {
    await page.route(`${API}/auth/login`, (route) =>
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Credenciais inválidas." })
      })
    );

    await page.goto("/login");
    await page.locator("#email").fill("errado@exemplo.com");
    await page.locator("#password").fill("palavrapasse-errada");
    await page.getByRole("button", { name: "Entrar" }).click();

    const feedback = page.getByRole("status");
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText("Credenciais inválidas.");
  });

  test("botão fica desativado enquanto o pedido está em curso", async ({ page }) => {
    let resolveRoute: () => void;
    const routeReady = new Promise<void>((resolve) => {
      resolveRoute = resolve;
    });

    await page.route(`${API}/auth/login`, async (route) => {
      resolveRoute();
      await new Promise((r) => setTimeout(r, 500));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ token: "fake.header.sig", user: adminUser })
      });
    });

    await page.route(`${API}/users/me`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: adminUser })
      })
    );

    await page.goto("/login");
    await page.locator("#email").fill("admin@caca.uac.pt");
    await page.locator("#password").fill("AdminCACA2026!");
    await page.getByRole("button", { name: "Entrar" }).click();

    await routeReady;
    await expect(page.getByRole("button", { name: /processar/i })).toBeDisabled();
  });

  test("link 'Criar conta' navega para /registo", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Criar conta" }).click();
    await expect(page).toHaveURL(/\/registo/);
  });

  test("registo — formulário de registo tem os campos obrigatórios", async ({ page }) => {
    await page.goto("/registo");
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Criar conta" })).toBeVisible();
  });

  test("registo com sucesso redireciona para /perfil", async ({ page }) => {
    await page.route(`${API}/auth/register`, (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ token: "fake.header.sig", user: { ...adminUser, role: "USER" } })
      })
    );
    await page.route(`${API}/users/me`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user: { ...adminUser, role: "USER" } })
      })
    );

    await page.goto("/registo");
    await page.locator("#name").fill("Teste Utilizador");
    await page.locator("#email").fill("novo@teste.pt");
    await page.locator("#password").fill("Senha123!");
    await page.getByRole("button", { name: "Criar conta" }).click();

    await expect(page).toHaveURL(/\/perfil/);
  });
});
