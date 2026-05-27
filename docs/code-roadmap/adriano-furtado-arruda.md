# Adriano Furtado Arruda — Backend/API

## Objetivo

Melhorar a API Fastify com funcionalidades reais de gestão, paginação, filtros, estados e testes adicionais.

## Tarefas de Código

- Adicionar paginação a `GET /api/users`.
- Adicionar pesquisa por nome/email a `GET /api/users`.
- Adicionar paginação a `GET /api/contact`.
- Adicionar filtro por estado a `GET /api/contact`.
- Adicionar paginação a `GET /api/newsletter`.
- Adicionar filtro de eventos por período em `GET /api/events?period=upcoming|past`.
- Adicionar validação para datas e horas de eventos no backend.

## Alterações no Prisma

- Atualizar `backend/prisma/schema.prisma`.
- Adicionar campo `status` ao modelo `ContactMessage`.
- Usar estados: `PENDING`, `READ`, `ARCHIVED`.
- Atualizar `backend/prisma/seed.ts` se for útil ter mensagens de exemplo.

## Endpoints Novos ou Melhorados

- `GET /api/users?page=1&limit=10&search=texto`
- `GET /api/contact?page=1&limit=10&status=PENDING`
- `PATCH /api/contact/:id/status`
- `GET /api/newsletter?page=1&limit=10`
- `GET /api/events?period=upcoming`
- `GET /api/events?period=past`

## Ficheiros Principais

- `backend/src/modules/users/user.schemas.ts`
- `backend/src/modules/users/user.service.ts`
- `backend/src/modules/users/user.controller.ts`
- `backend/src/modules/communications/communication.schemas.ts`
- `backend/src/modules/communications/communication.service.ts`
- `backend/src/modules/communications/communication.controller.ts`
- `backend/src/modules/communications/communication.routes.ts`
- `backend/src/modules/events/event.schemas.ts`
- `backend/src/modules/events/event.service.ts`
- `backend/tests/auth.integration.test.ts`

## Testes Esperados

- Utilizador normal não consegue listar utilizadores.
- Admin consegue listar utilizadores com paginação.
- Pesquisa por utilizador devolve resultados corretos.
- Admin consegue alterar estado de mensagens.
- Utilizador normal não consegue alterar estado de mensagens.
- Eventos passados e futuros são filtrados corretamente.

## Critério de Aceitação

- `npm run test --workspace backend` passa.
- Swagger mostra os novos query params e endpoints.
- Respostas paginadas devolvem dados e metadados.
- Erros `401`, `403` e `404` continuam tratados corretamente.
