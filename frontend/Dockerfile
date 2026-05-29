# Multi-stage Dockerfile for ChileRisk Frontend (Next.js 16)
# Required by project rules (AGENTS.md)

FROM node:22-alpine AS base

# 1. Dependencies stage
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred lockfile
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Runner stage (minimal production image)
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

# Health check endpoint will be added at /api/health
CMD ["node", "server.js"]
