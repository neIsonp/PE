# Puțan Iulia — Testes E2E e Acessibilidade

## Objetivo

Adicionar testes end-to-end e verificações de acessibilidade para provar que os fluxos principais funcionam no browser.

## Tarefas de Código

- Instalar e configurar Playwright no workspace frontend.
- Criar testes E2E para autenticação.
- Criar testes E2E para gestão de eventos.
- Criar testes E2E para painel de administração.
- Criar testes E2E para contacto e newsletter.
- Integrar testes E2E no GitHub Actions.
- Adicionar verificação básica de acessibilidade com `@axe-core/playwright`.

## Ficheiros Novos

- `frontend/playwright.config.ts`
- `frontend/e2e/login.spec.ts`
- `frontend/e2e/events.spec.ts`
- `frontend/e2e/admin.spec.ts`
- `frontend/e2e/contact-newsletter.spec.ts`
- `frontend/e2e/accessibility.spec.ts`

## Scripts a Adicionar

- Em `frontend/package.json`: `test:e2e`.
- Em `package.json`: `test:e2e`.
- Em `.github/workflows/ci.yml`: passo opcional para E2E depois do build.

## Fluxos a Testar

- Login com admin criado pelo seed.
- Acesso ao painel `/admin`.
- Criação de evento autenticado.
- Edição de perfil.
- Envio de mensagem de contacto.
- Subscrição na newsletter.
- Visitante não autenticado não consegue gerir eventos.

## Acessibilidade

- Verificar se cada página tem um `main`.
- Verificar se formulários têm labels.
- Verificar se não existem violações críticas de axe.
- Verificar navegação por teclado em login, perfil e admin.

## Critério de Aceitação

- `npm run test:e2e --workspace frontend` passa.
- CI consegue executar testes E2E.
- Pelo menos as páginas `/`, `/login`, `/eventos`, `/perfil` e `/admin` são testadas.
- Falhas de acessibilidade críticas são corrigidas ou justificadas.
