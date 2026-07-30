# syntax=docker/dockerfile:1.7
# Multi-stage Dockerfile for ChileRisk Frontend (Next.js 16)
# Uses bun as the package manager (standardized for this monorepo).
# Required by project rules (AGENTS.md)

FROM oven/bun:1-alpine AS base

# 1. Dependencies stage
FROM base AS deps
WORKDIR /app

# Install dependencies using bun (bun.lock is the source of truth)
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# 2. Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# 3. Runner stage (minimal production image)
# We stay on the bun base image (fast + compatible with Next standalone output).
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user (security best practice)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary artifacts from builder
COPY --from=builder /app/public ./public

# Standalone output (requires output: 'standalone' in next.config.ts)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 127.0.0.1: Alpine wget resolves localhost→::1; app binds IPv4 only (Dokploy/Dockerfile deploys).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:3000/api/health || exit 1

CMD ["bun", "server.js"]
