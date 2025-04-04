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
COPY backend/prisma ./prisma
RUN npm install
COPY backend/ .
RUN npm run build

# Production image
FROM backend-builder
WORKDIR /app

# Copy frontend build and backend dist
COPY --from=frontend-builder /app/frontend/dist ./dist/frontend
COPY --from=backend-builder /app/backend/dist ./dist/backend
COPY --from=backend-builder /app/backend/prisma ./prisma

EXPOSE 3001
# Use src/index.ts for development, dist/index.js for production
CMD ["sh", "-c", "cd /app && sleep 10 && npx prisma generate && npx prisma migrate deploy && node backend/dist/app.js"]
