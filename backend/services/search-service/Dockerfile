FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY backend/shared/package*.json ./backend/shared/
COPY backend/services/search-service/package*.json ./backend/services/search-service/
RUN npm ci --workspace=@ace/shared --workspace=@ace/search-service
COPY backend/shared ./backend/shared
COPY backend/services/search-service ./backend/services/search-service
RUN npm run build --workspace=@ace/shared && npm run build --workspace=@ace/search-service

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system acegroup && adduser --system aceuser --ingroup acegroup
COPY --from=builder /app/backend/shared/dist ./backend/shared/dist
COPY --from=builder /app/backend/shared/node_modules ./backend/shared/node_modules
COPY --from=builder /app/backend/shared/package*.json ./backend/shared/
COPY --from=builder /app/backend/services/search-service/dist ./backend/services/search-service/dist
COPY --from=builder /app/backend/services/search-service/node_modules ./backend/services/search-service/node_modules
COPY --from=builder /app/backend/services/search-service/package*.json ./backend/services/search-service/
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
USER aceuser
EXPOSE 4005
CMD ["node", "backend/services/search-service/dist/index.js"]
