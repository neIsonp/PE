# David Cardoso — Frontend/UX

## Objetivo

Melhorar a experiência do utilizador no frontend Next.js, consumindo as novas funcionalidades da API e criando componentes reutilizáveis.

## Tarefas de Código

- Adicionar pesquisa e paginação ao painel de utilizadores em `/admin`.
- Adicionar filtro de mensagens por estado em `/admin`.
- Adicionar ação para marcar mensagens como `READ` ou `ARCHIVED`.
- Adicionar paginação às mensagens e subscrições no painel admin.
- Adicionar filtro “Próximos” e “Passados” na página `/eventos`.
- Adicionar confirmação antes de eliminar eventos.
- Melhorar loading states e empty states nas páginas dinâmicas.

## Componentes Novos

- `frontend/src/components/ui/LoadingState.tsx`
- `frontend/src/components/ui/ErrorState.tsx`
- `frontend/src/components/ui/EmptyState.tsx`
- `frontend/src/components/ui/Pagination.tsx`
- `frontend/src/components/ui/ConfirmDialog.tsx`

## Ficheiros Principais

- `frontend/src/components/admin/AdminDashboard.tsx`
- `frontend/src/components/events/EventsManager.tsx`
- `frontend/src/components/events/EventsList.tsx`
- `frontend/src/lib/api-client.ts`
- `frontend/src/types/events.ts`
- `frontend/src/types/auth.ts`
- `frontend/src/app/globals.css`

## Melhorias de UX

- Mostrar mensagem clara quando não existem resultados.
- Desativar botões enquanto pedidos estão em curso.
- Mostrar feedback visual após alterar permissões ou estados.
- Garantir que tabelas/cartões do admin ficam bons em mobile.
- Garantir navegação por teclado em filtros, paginação e ações.

## Testes Manuais Esperados

- Admin pesquisa utilizadores por nome e email.
- Admin filtra mensagens por estado.
- Admin arquiva uma mensagem.
- Visitante vê eventos, mas não consegue criar/editar/eliminar.
- Utilizador autenticado consegue gerir eventos.

## Critério de Aceitação

- `npm run lint --workspace frontend` passa.
- `npm run build --workspace frontend` passa.
- `/admin` continua protegido para administradores.
- A interface fica utilizável em mobile, tablet e desktop.
