# Multi-stage build for Next.js app
# Stage 1: Dependencies and build
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies as root (needed for build)
COPY package.json package-lock.json* .npmrc* ./
# .npmrc handles legacy-peer-deps for React 19 compatibility
# Install all dependencies including devDependencies for build
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Build arguments (secrets should be passed at runtime, not build time)
ARG NEXT_PUBLIC_API_URL
ARG SERVER_API_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET

# Build the application
RUN NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    SERVER_API_URL=${SERVER_API_URL} \
    NEXTAUTH_URL=${NEXTAUTH_URL} \
    NEXTAUTH_SECRET=${NEXTAUTH_SECRET} \
    npm run build

# Stage 2: Production runtime
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy only necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set proper ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

