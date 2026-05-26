FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM node:24-alpine
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
EXPOSE 3002
CMD ["node", "dist/main.js"]
