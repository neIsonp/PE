import { test, expect } from "@playwright/test";

const API = "http://localhost:3333/api";

test.describe("Contacto — formulário na página inicial", () => {
  test("submissão com sucesso mostra mensagem de confirmação", async ({ page }) => {
    // Glob pattern avoids any host/port mismatch when NEXT_PUBLIC_API_URL is set.
    await page.route("**/api/contact", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ message: { id: "contact-msg-id" } })
      })
    );

    await page.goto("/");
    // networkidle ensures React bundles have loaded and hydrated before form interaction.
    await page.waitForLoadState("networkidle");

    const form = page.locator("#contactos form");
    await form.scrollIntoViewIfNeeded();
    await expect(form).toBeVisible({ timeout: 10000 });

    await form.locator("#first-name").fill("Maria");
    await form.locator("#last-name").fill("Silva");
    await form.locator("#email").fill("maria@exemplo.pt");
    await form.locator("#phone").fill("912345678");

    const msgText = "Mensagem de teste E2E com mais de dez caracteres.";
    await form.locator("#message").fill(msgText);
    // The #message textarea is a controlled React input (value={message}).
    // fill() dispatches the input event but React's setMessage() is async.
    // toHaveValue() polls until React has committed the state update to the DOM,
    // ensuring the browser's required/minLength validation sees a non-empty value.
    await expect(form.locator("#message")).toHaveValue(msgText);

    await form.getByRole("button", { name: "Enviar Mensagem" }).click();

    // Scope to #contactos: the newsletter div also carries role="status" in the DOM.
    const feedbackStatus = page.locator('#contactos [role="status"]');
    await expect(feedbackStatus).toContainText("Mensagem enviada", { timeout: 8000 });
  });

  test("submissão com telefone inválido mostra erro de validação", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const form = page.locator("#contactos form");
    await form.scrollIntoViewIfNeeded();
    await expect(form).toBeVisible({ timeout: 10000 });

    // Valid email (passes browser HTML5 validation) but phone too short (triggers our JS validation)
    await form.locator("#first-name").fill("João");
    await form.locator("#last-name").fill("Costa");
    await form.locator("#email").fill("joao@exemplo.pt");
    await form.locator("#phone").fill("12345"); // 5 digits → fails our ≥6 digit check
    await form.locator("#message").fill("Mensagem com telefone inválido para teste E2E.");

    await form.getByRole("button", { name: "Enviar Mensagem" }).click();

    const feedbackStatus = page.locator('#contactos [role="status"]');
    await expect(feedbackStatus).toContainText("email", { timeout: 8000 });
  });

  test("erro da API mostra mensagem de falha", async ({ page }) => {
    await page.route(`${API}/contact`, (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Erro interno do servidor." })
      })
    );

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const form = page.locator("#contactos form");
    await form.scrollIntoViewIfNeeded();
    await expect(form).toBeVisible({ timeout: 10000 });

    await form.locator("#first-name").fill("Ana");
    await form.locator("#last-name").fill("Ferreira");
    await form.locator("#email").fill("ana@exemplo.pt");
    await form.locator("#phone").fill("963000000");
    await form.locator("#message").fill("Mensagem que vai falhar por erro de servidor nos testes E2E.");

    await form.getByRole("button", { name: "Enviar Mensagem" }).click();

    const feedbackStatus = page.locator('#contactos [role="status"]');
    await expect(feedbackStatus).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Newsletter — secção na página inicial", () => {
  test("formulário de newsletter está presente", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const section = page.locator("#newsletter");
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();

    await expect(page.locator("#news-email")).toBeVisible();
    // Scope button lookup to the newsletter form to avoid matching other "Subscrever"
    // buttons that may exist elsewhere on the home page.
    await expect(page.locator("#newsletter-form button[type='submit']")).toBeVisible();
  });

  test("subscrição com sucesso mostra confirmação", async ({ page }) => {
    await page.route(`${API}/newsletter`, (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          subscription: { id: "sub-id", email: "sub@test.pt", createdAt: "2026-01-01T00:00:00.000Z" }
        })
      })
    );

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const section = page.locator("#newsletter");
    await section.scrollIntoViewIfNeeded();

    await page.locator("#news-email").fill("sub@test.pt");
    // Scoped to the newsletter form to avoid matching any other "Subscrever" buttons.
    await page.locator("#newsletter-form button[type='submit']").click();

    const feedback = page.locator("#newsletter-feedback");
    await expect(feedback).toContainText("Subscrição registada", { timeout: 8000 });
  });

  test("subscrição com email inválido mostra erro de validação", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const section = page.locator("#newsletter");
    await section.scrollIntoViewIfNeeded();

    // Disable browser HTML5 validation so our custom JS validation fires
    await page.locator("#newsletter-form").evaluate((form: HTMLFormElement) => {
      form.setAttribute("novalidate", "");
    });

    await page.locator("#news-email").fill("nao-e-um-email");
    await page.locator("#newsletter-form button[type='submit']").click();

    const feedback = page.locator("#newsletter-feedback");
    await expect(feedback).toContainText("email válido", { timeout: 8000 });
  });

  test("email duplicado mostra erro da API", async ({ page }) => {
    await page.route(`${API}/newsletter`, (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ message: "Este email já está subscrito." })
      })
    );

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const section = page.locator("#newsletter");
    await section.scrollIntoViewIfNeeded();

    await page.locator("#news-email").fill("jasubscrito@test.pt");
    await page.locator("#newsletter-form button[type='submit']").click();

    const feedback = page.locator("#newsletter-feedback");
    await expect(feedback).toBeVisible({ timeout: 8000 });
    await expect(feedback).toContainText("subscrito");
  });
});
