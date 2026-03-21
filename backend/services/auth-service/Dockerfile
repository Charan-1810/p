FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/shared/package*.json ./backend/shared/
COPY backend/services/auth-service/package*.json ./backend/services/auth-service/

RUN npm config set registry https://registry.npmjs.org/ \
 && npm cache clean --force \
 && npm ci --workspace=@ace/shared --workspace=@ace/auth-service

COPY backend/shared ./backend/shared
COPY backend/services/auth-service ./backend/services/auth-service

RUN npm run build --workspace=@ace/shared && npm run build --workspace=@ace/auth-service


FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system acegroup && adduser --system aceuser --ingroup acegroup

COPY --from=builder /app/backend/shared/dist ./backend/shared/dist
COPY --from=builder /app/backend/shared/node_modules ./backend/shared/node_modules
COPY --from=builder /app/backend/shared/package*.json ./backend/shared/

COPY --from=builder /app/backend/services/auth-service/dist ./backend/services/auth-service/dist
COPY --from=builder /app/backend/services/auth-service/node_modules ./backend/services/auth-service/node_modules
COPY --from=builder /app/backend/services/auth-service/package*.json ./backend/services/auth-service/
COPY --from=builder /app/backend/services/auth-service/src/migrations ./backend/services/auth-service/src/migrations

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

USER aceuser

EXPOSE 4001

CMD ["node", "backend/services/auth-service/dist/index.js"]