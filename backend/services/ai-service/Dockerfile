FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY backend/shared/package*.json ./backend/shared/
COPY backend/services/ai-service/package*.json ./backend/services/ai-service/
RUN npm ci --workspace=@ace/shared --workspace=@ace/ai-service
COPY backend/shared ./backend/shared
COPY backend/services/ai-service ./backend/services/ai-service
RUN npm run build --workspace=@ace/shared && npm run build --workspace=@ace/ai-service

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system acegroup && adduser --system aceuser --ingroup acegroup
COPY --from=builder /app/backend/shared/dist ./backend/shared/dist
COPY --from=builder /app/backend/shared/node_modules ./backend/shared/node_modules
COPY --from=builder /app/backend/shared/package*.json ./backend/shared/
COPY --from=builder /app/backend/services/ai-service/dist ./backend/services/ai-service/dist
COPY --from=builder /app/backend/services/ai-service/node_modules ./backend/services/ai-service/node_modules
COPY --from=builder /app/backend/services/ai-service/package*.json ./backend/services/ai-service/
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
USER aceuser
EXPOSE 4006
CMD ["node", "backend/services/ai-service/dist/index.js"]
