# Multi-stage build for Next.js app
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* .npmrc* ./

# Install dependencies
RUN npm ci --no-audit

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments: only public/build-time values. Never pass secrets (NEXTAUTH_SECRET,
# SERVER_API_URL) here - they are read at runtime from the container environment.
ARG NEXT_PUBLIC_API_URL
ARG NEXTAUTH_URL

# Build the application (NEXTAUTH_SECRET and SERVER_API_URL must be set at runtime)
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXTAUTH_URL=${NEXTAUTH_URL} \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone build output (this includes server.js, node_modules, package.json)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Ensure .next directory exists and copy static files (standalone mode requires this)
# The standalone build may or may not have .next directory, so we ensure it exists
RUN mkdir -p .next && chown -R nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public folder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Verify server.js exists (will fail build if missing - helps catch build issues early)
RUN test -f server.js || (echo "ERROR: server.js not found in standalone build" && exit 1)

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000

# Run the server (server.js is in the root of /app after copying standalone)
# In standalone mode, we run server.js directly, not through npm
CMD ["node", "server.js"]
