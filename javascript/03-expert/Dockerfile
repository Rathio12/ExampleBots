# ---- Build stage: install production dependencies (compiles better-sqlite3 if needed)
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --omit=dev

# ---- Runtime stage: small image, non-root user
FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# The database lives in a volume so it survives container rebuilds.
RUN mkdir -p /app/data && chown -R node:node /app/data
VOLUME ["/app/data"]
ENV DATABASE_PATH=/app/data/bot.db

USER node
CMD ["node", "src/index.js"]
