# Nelson Pacheco Ponte — Integração, Segurança e Arquitetura

## Objetivo

Garantir que o projeto fica integrado, robusto, fácil de executar e preparado para avaliação final.

## Tarefas de Código

- Criar `docker-compose.yml` para arrancar frontend e backend com um comando.
- Adicionar `Dockerfile` para `backend`.
- Adicionar `Dockerfile` para `frontend`.
- Criar `frontend/src/components/auth/AuthGate.tsx` para proteger páginas e ações.
- Melhorar `frontend/src/lib/api-client.ts` com tratamento global de `401`.
- Adicionar logout automático quando o token expira.
- Melhorar o `Header` para mostrar estado de sessão.
- Adicionar request id/logs estruturados no backend.

## Segurança e Robustez

- Garantir que o token JWT expirado limpa a sessão no frontend.
- Garantir que `/admin` não mostra dados se o utilizador não for `ADMIN`.
- Rever CORS e variáveis de ambiente.
- Confirmar que `.env`, `.env.local` e bases SQLite locais não entram no Git.
- Documentar no código os pontos críticos apenas onde houver funções complexas.

## Ficheiros Principais

- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `backend/src/app.ts`
- `backend/src/plugins/auth.ts`
- `frontend/src/lib/api-client.ts`
- `frontend/src/lib/storage.ts`
- `frontend/src/components/layout/Header.tsx`
- `frontend/src/components/auth/AuthGate.tsx`

## Integração Final

- Correr `npm run check`.
- Correr app local com `npm run dev`.
- Testar fluxo completo: registo, login, perfil, eventos, admin, contacto e newsletter.
- Confirmar GitHub Actions depois do push.
- Confirmar que o README corresponde ao comportamento real da aplicação.

## Critério de Aceitação

- Projeto arranca localmente sem passos escondidos.
- `npm run check` passa.
- GitHub Actions passa.
- Não existem ficheiros sensíveis no Git.
- Frontend e backend têm comportamento consistente em erro, loading e sessão expirada.
