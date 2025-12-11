# Basic Dockerfile for Next.js app
FROM node:18-alpine
WORKDIR /app

ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY package.json package-lock.json* .npmrc* ./
# .npmrc handles legacy-peer-deps for React 19 compatibility
# Install all dependencies including devDependencies for build
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build
RUN npm prune --production

ENV NODE_ENV=production

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]

