FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci

FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY backend ./backend

RUN npm run db:generate --workspace backend
RUN npm run build --workspace backend

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY --from=builder /app/backend/dist backend/dist
COPY --from=builder /app/backend/prisma backend/prisma

EXPOSE 3333

CMD ["sh", "-c", "npm run db:migrate --workspace backend && npm run db:seed --workspace backend && npm run start --workspace backend"]
