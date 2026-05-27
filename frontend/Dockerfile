FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json

RUN npm ci

FROM node:20-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:3333/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY frontend ./frontend

RUN npm run build --workspace frontend

FROM node:20-alpine AS runner

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:3333/api
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY frontend/next.config.ts frontend/next.config.ts
COPY --from=builder /app/frontend/.next frontend/.next
COPY --from=builder /app/frontend/public frontend/public

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace", "frontend"]
