FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/shared/package*.json ./backend/shared/
COPY backend/api-gateway/package*.json ./backend/api-gateway/

RUN npm ci --workspace=@ace/shared --workspace=@ace/api-gateway

COPY backend/shared ./backend/shared
COPY backend/api-gateway ./backend/api-gateway

RUN npm run build --workspace=@ace/shared && npm run build --workspace=@ace/api-gateway

# ─── Production image ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 aceuser

COPY --from=builder /app/backend/shared/dist ./backend/shared/dist
COPY --from=builder /app/backend/shared/node_modules ./backend/shared/node_modules
COPY --from=builder /app/backend/shared/package*.json ./backend/shared/

COPY --from=builder /app/backend/api-gateway/dist ./backend/api-gateway/dist
COPY --from=builder /app/backend/api-gateway/node_modules ./backend/api-gateway/node_modules
COPY --from=builder /app/backend/api-gateway/package*.json ./backend/api-gateway/

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

USER aceuser

ENV NODE_ENV=production
EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "backend/api-gateway/dist/index.js"]
