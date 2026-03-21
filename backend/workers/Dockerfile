FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY backend/shared/package*.json ./backend/shared/
COPY backend/workers/package*.json ./backend/workers/
RUN npm ci --workspace=@ace/shared --workspace=@ace/workers
COPY backend/shared ./backend/shared
COPY backend/workers ./backend/workers
RUN npm run build --workspace=@ace/shared && npm run build --workspace=@ace/workers

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache git
RUN addgroup --system acegroup && adduser --system aceuser --ingroup acegroup
# Workers need to write cloned repos; mount a volume at /tmp/ace-repos
RUN mkdir -p /tmp/ace-repos && chown aceuser:acegroup /tmp/ace-repos
COPY --from=builder /app/backend/shared/dist ./backend/shared/dist
COPY --from=builder /app/backend/shared/node_modules ./backend/shared/node_modules
COPY --from=builder /app/backend/shared/package*.json ./backend/shared/
COPY --from=builder /app/backend/workers/dist ./backend/workers/dist
COPY --from=builder /app/backend/workers/node_modules ./backend/workers/node_modules
COPY --from=builder /app/backend/workers/package*.json ./backend/workers/
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
USER aceuser
CMD ["node", "backend/workers/dist/workers/src/index.js"]
