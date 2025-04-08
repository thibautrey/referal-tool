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
RUN npx prisma generate
COPY backend/ .
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy backend package files and install dependencies in the final image
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma
WORKDIR /app/backend
RUN npm install --omit=dev
RUN npx prisma generate

# Copy compiled backend code
COPY --from=backend-builder /app/backend/dist ./dist

WORKDIR /app
EXPOSE 3001

CMD ["node", "backend/dist/index.js"]
