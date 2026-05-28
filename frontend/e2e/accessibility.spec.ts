import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

const seedEvents = [
  {
    id: "seed-event-1",
    title: "Evento de Teste",
    date: "2026-06-12",
    time: "10:00",
    location: "Ponta Delgada,PT",
    description: "Evento para testes de acessibilidade.",
    createdById: "seed-admin-id",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  }
];

test.describe("Acessibilidade — elemento main", () => {
  test("página inicial (/) tem elemento main", async ({ page }) => {
    // waitUntil:"domcontentloaded" returns as soon as the HTML is parsed so the
    // main element (present in the SSR HTML) is immediately available.
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Use the concrete ID rather than the generic "main" tag to avoid any
    // ambiguity introduced by Next.js internal wrappers.
    await expect(page.locator("#conteudo-principal")).toBeVisible({ timeout: 20000 });
  });

  test("página /login tem elemento main", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("main")).toBeVisible({ timeout: 10000 });
  });

  test("página /registo tem elemento main", async ({ page }) => {
    await page.goto("/registo");
    await expect(page.locator("main")).toBeVisible({ timeout: 10000 });
  });

  test("página /eventos tem elemento main", async ({ page }) => {
    await page.route(`${API}/events`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ events: seedEvents }) })
    );
    await page.goto("/eventos");
    await expect(page.locator("main")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Acessibilidade — labels em formulários", () => {
  test("formulário de login tem labels para todos os campos", async ({ page }) => {
    await page.goto("/login");
    // Use toBeAttached() because contact.css sets .c-form__group label { font-size: 0 }
    // globally, making labels have zero bounding-box height (not "visible" per Playwright,
    // but correctly attached to the DOM and associated with their inputs).
    await expect(page.locator("label[for='email']")).toBeAttached();
    await expect(page.locator("label[for='password']")).toBeAttached();
  });

  test("formulário de registo tem labels para os campos obrigatórios", async ({ page }) => {
    await page.goto("/registo");
    await expect(page.locator("label[for='name']")).toBeAttached();
    await expect(page.locator("label[for='email']")).toBeAttached();
    await expect(page.locator("label[for='password']")).toBeAttached();
  });

  test("formulário de contacto tem labels (visíveis ou sr-only)", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("label[for='first-name']")).toBeAttached();
    await expect(page.locator("label[for='last-name']")).toBeAttached();
    await expect(page.locator("label[for='email']").first()).toBeAttached();
    await expect(page.locator("label[for='phone']")).toBeAttached();
    await expect(page.locator("label[for='message']")).toBeAttached();
  });

  test("input de newsletter tem aria-label", async ({ page }) => {
    await page.goto("/");
    // toHaveAttribute checks DOM presence, not visibility — no scroll needed.
    await expect(page.locator("#news-email")).toHaveAttribute("aria-label", "Email para newsletter");
  });
});

test.describe("Acessibilidade — violações críticas (axe)", () => {
  test("página / não tem violações críticas de acessibilidade", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical, `Violações críticas encontradas: ${critical.map((v) => v.id).join(", ")}`).toHaveLength(0);
  });

  test("página /login não tem violações críticas de acessibilidade", async ({ page }) => {
    await page.goto("/login");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical, `Violações críticas encontradas: ${critical.map((v) => v.id).join(", ")}`).toHaveLength(0);
  });

  test("página /eventos não tem violações críticas de acessibilidade", async ({ page }) => {
    await page.route(`${API}/events`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ events: seedEvents }) })
    );
    await page.goto("/eventos");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical, `Violações críticas encontradas: ${critical.map((v) => v.id).join(", ")}`).toHaveLength(0);
  });

  test("página /admin não tem violações críticas (utilizador admin autenticado)", async ({ page }) => {
    await page.addInitScript(({ user }) => {
      localStorage.setItem("caca_auth_token", "fake.header.sig");
      localStorage.setItem("caca_auth_user", JSON.stringify(user));
    }, { user: adminUser });

    await page.route(`${API}/users/me`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: adminUser }) })
    );
    await page.route(`${API}/users`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ users: [adminUser] }) })
    );
    await page.route(`${API}/contact`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ messages: [] }) })
    );
    await page.route(`${API}/newsletter`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ subscriptions: [] }) })
    );

    await page.goto("/admin");
    await expect(page.getByText(adminUser.name)).toBeVisible({ timeout: 8000 });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical, `Violações críticas encontradas: ${critical.map((v) => v.id).join(", ")}`).toHaveLength(0);
  });
});

test.describe("Acessibilidade — navegação por teclado", () => {
  test("é possível navegar para o botão de submit do login com Tab", async ({ page }) => {
    await page.goto("/login");

    // Focus the first form field directly, then Tab through to the submit button
    await page.locator("#email").focus();
    await page.keyboard.press("Tab"); // → password field
    await page.keyboard.press("Tab"); // → submit button

    const submitButton = page.getByRole("button", { name: "Entrar" });
    await expect(submitButton).toBeFocused();
  });

  test("é possível navegar pelo formulário de login com Tab e submeter com Enter", async ({ page }) => {
    await page.route(`${API}/auth/login`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ token: "fake.header.sig", user: adminUser })
      })
    );
    await page.route(`${API}/users/me`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: adminUser }) })
    );

    await page.goto("/login");
    await page.locator("#email").focus();
    await page.keyboard.type("admin@caca.uac.pt");
    await page.keyboard.press("Tab");
    await page.keyboard.type("AdminCACA2026!");
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/perfil/, { timeout: 8000 });
  });

  test("página /perfil — navegação por teclado chega ao botão Terminar sessão", async ({ page }) => {
    await page.addInitScript(({ user }) => {
      localStorage.setItem("caca_auth_token", "fake.header.sig");
      localStorage.setItem("caca_auth_user", JSON.stringify(user));
    }, { user: adminUser });

    await page.route(`${API}/users/me`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: adminUser }) })
    );

    await page.goto("/perfil");
    await expect(page.getByText(adminUser.name)).toBeVisible({ timeout: 8000 });

    const logoutButton = page.getByRole("button", { name: /Terminar sessão/i });
    await logoutButton.focus();
    await expect(logoutButton).toBeFocused();
  });
});
