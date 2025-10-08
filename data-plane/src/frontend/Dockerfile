# Multi-stage Dockerfile for Next.js app
# Stage 1: Builder
FROM node:18-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* .npmrc* ./
# .npmrc handles legacy-peer-deps for React 19 compatibility
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build
RUN npm prune --production   # ⬅️ removes devDependencies

# Stage 2: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Environment variables will be set at runtime, not at build time

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]


