FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY backend/shared/package*.json ./backend/shared/
COPY backend/services/parser-service/package*.json ./backend/services/parser-service/

RUN npm ci --workspace=@ace/shared --workspace=@ace/parser-service

COPY backend/shared ./backend/shared
COPY backend/services/parser-service ./backend/services/parser-service

RUN npm run build --workspace=@ace/shared && npm run build --workspace=@ace/parser-service


FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup --system acegroup && adduser --system aceuser --ingroup acegroup

COPY --from=builder /app/backend/shared/dist ./backend/shared/dist
COPY --from=builder /app/backend/shared/node_modules ./backend/shared/node_modules
COPY --from=builder /app/backend/shared/package*.json ./backend/shared/

COPY --from=builder /app/backend/services/parser-service/dist ./backend/services/parser-service/dist
COPY --from=builder /app/backend/services/parser-service/node_modules ./backend/services/parser-service/node_modules
COPY --from=builder /app/backend/services/parser-service/package*.json ./backend/services/parser-service/

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

USER aceuser

EXPOSE 4003

CMD ["node", "backend/services/parser-service/dist/index.js"]