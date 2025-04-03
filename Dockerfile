# Build frontend
FROM node:20-alpine as frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Build backend
FROM node:20-alpine as backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app

# Copy backend source and build
COPY --from=backend-builder /app/backend/src ./src
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/package*.json ./
COPY --from=backend-builder /app/backend/node_modules ./node_modules

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./dist/frontend/dist

EXPOSE 3001
# Use src/index.ts for development, dist/index.js for production
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"development\" ]; then npx ts-node-dev --respawn --transpile-only src/index.ts; else node dist/index.js; fi"]
