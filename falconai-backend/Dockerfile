# Stage 1: Build the application
FROM node:18-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# Skip prepare script (husky) during Docker build
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

RUN pnpm build

RUN pnpm switchAlias

# Stage 2: Create the production image
FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/schema/generated ./src/schema/generated

ENV CI=true
# Skip prepare script during production dependency pruning
RUN pnpm prune --prod --ignore-scripts

EXPOSE 3000

CMD ["pnpm", "serve"]
