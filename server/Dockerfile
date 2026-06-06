FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN echo "onlyBuiltDependencies:" > pnpm-workspace.yaml && \
    echo "  - '@prisma/engines'" >> pnpm-workspace.yaml && \
    echo "  - prisma" >> pnpm-workspace.yaml && \
    echo "  - esbuild" >> pnpm-workspace.yaml && \
    echo "  - '@nestjs/core'" >> pnpm-workspace.yaml && \
    echo "  - unrs-resolver" >> pnpm-workspace.yaml
RUN echo "node-linker=hoisted" > .npmrc
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM node:24-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
EXPOSE 3002
CMD ["node", "dist/src/main.js"]
