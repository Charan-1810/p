FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./frontend/
COPY package*.json ./
RUN npm ci --workspace=@ace/frontend
COPY frontend ./frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=@ace/frontend

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system acegroup && adduser --system aceuser --ingroup acegroup
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public
USER aceuser
EXPOSE 3000
CMD ["node", "frontend/server.js"]
