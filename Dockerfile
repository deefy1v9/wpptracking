# ─── Stage 1: Build frontend + backend ───────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Install ALL dependencies (including workspace-specific node_modules)
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
RUN npm ci

# Copy source code
COPY . .

# Build Vite frontend
RUN npm run build --workspace=frontend

# Build Express backend (TypeScript → JavaScript)
RUN npm run build --workspace=backend

# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install only production deps
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
RUN npm ci --omit=dev

# Copy compiled backend
COPY --from=builder /app/backend/dist ./backend/dist

# Copy Vite-built frontend (served as static files by Express)
COPY --from=builder /app/frontend/dist ./frontend/dist

# Copy Drizzle migration files (run at container startup)
COPY --from=builder /app/backend/drizzle ./backend/drizzle

# Copy entrypoint script
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
