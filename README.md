# CACA Platform

Refatorização do projeto do Centro Académico Clínico dos Açores para uma arquitetura moderna em monorepo, com frontend em Next.js e API de gestão de utilizadores em Fastify.

## Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Leaflet e CSS modular reaproveitado do projeto original.
- **Backend:** Node.js, Fastify, TypeScript, Zod, Prisma, JWT, bcrypt, Helmet, CORS, rate limit e Swagger.
- **Base de dados:** SQLite por defeito para desenvolvimento, com Prisma preparado para evoluir para PostgreSQL/MySQL.
- **Qualidade:** TypeScript estrito, testes Vitest no backend e organização por módulos.

## Estrutura

```txt
.
├── backend/
│   ├── prisma/                 # Schema Prisma e seed
│   └── src/
│       ├── config/             # Variáveis de ambiente validadas
│       ├── modules/
│       │   ├── auth/           # Registo e login
│       │   └── users/          # Perfil e permissões
│       ├── plugins/            # Prisma e autenticação JWT
│       └── shared/             # Erros, schemas e utilitários
├── frontend/
│   ├── public/assets/          # Imagens e logótipo CACA
│   └── src/
│       ├── app/                # Rotas Next.js
│       ├── components/         # UI modular por domínio
│       ├── data/               # Dados estáticos
│       ├── hooks/              # Estado local reutilizável
│       ├── lib/                # API client, storage, weather
│       ├── styles/             # CSS original preservado por camadas
│       └── types/              # Tipos partilhados do frontend
└── package.json                # Workspaces e scripts globais
```

## Funcionalidades

- Landing page CACA migrada para componentes React, mantendo a identidade visual original.
- Gestão de eventos com criação, edição, eliminação, persistência local e mapa Leaflet.
- Consulta meteorológica via Open-Meteo para eventos.
- Newsletter e formulário de contacto com validação client-side.
- Registo, login e perfil de utilizador integrados com API JWT.
- API documentada em `/docs`, com validação Zod e permissões básicas `ADMIN`/`USER`.

## Configuração

1. Instalar dependências:

```bash
npm install
```

2. Criar variáveis de ambiente:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

3. Gerar Prisma Client e preparar a base de dados:

```bash
npm run db:generate --workspace backend
npm run db:push --workspace backend
npm run db:seed --workspace backend
```

4. Executar frontend e backend em paralelo:

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3333`
- Swagger: `http://localhost:3333/docs`

## Scripts

```bash
npm run dev              # Next.js + Fastify em paralelo
npm run dev:frontend     # Apenas frontend
npm run dev:backend      # Apenas backend
npm run build            # Build completo
npm run lint             # Typecheck backend + frontend
npm run test             # Testes backend
```

## Endpoints Principais

- `POST /api/auth/register` — regista novo utilizador.
- `POST /api/auth/login` — autentica e devolve JWT.
- `GET /api/users/me` — devolve perfil autenticado.
- `PUT /api/users/me` — atualiza perfil autenticado.
- `GET /api/users` — lista utilizadores, apenas `ADMIN`.
- `PATCH /api/users/:id/role` — altera permissões, apenas `ADMIN`.

## Validação

Foram executados com sucesso:

```bash
npm run lint
npm run build
npm run test
```

## Notas de Segurança

- Passwords guardadas com hash bcrypt.
- JWT assinado com `JWT_SECRET`.
- Entrada validada com Zod no backend.
- Helmet, CORS e rate limiting ativos no Fastify.
- HTML dinâmico do mapa é escapado antes de ser injetado nos popups.
