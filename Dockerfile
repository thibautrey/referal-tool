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
ARG REACT_APP_ENV=production
ARG REACT_APP_API_URL=https://rflnk.com/api
ARG NODE_ENV=production

ENV REACT_APP_ENV=${REACT_APP_ENV}
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV NODE_ENV=${NODE_ENV}
ENV ILA_LICENSE_KEY=${ILA_LICENSE_KEY}
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app

# Create IP database directories
RUN mkdir -p /app/data /app/tmp

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy backend package files and install dependencies in the final image
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma
WORKDIR /app/backend
RUN npm install --omit=dev
RUN npx prisma generate

# Install ip-location-api as a production dependency
RUN npm install ip-location-api --save

# Copy compiled backend code
COPY --from=backend-builder /app/backend/dist ./dist

# Remove the failing database download step
# WORKDIR /app/backend
# RUN echo "const { updateDb } = require('ip-location-api'); ... > download-db.js && node download-db.js

WORKDIR /app

# Create the startup script in the dist folder
COPY --from=backend-builder /app/backend/src/start.js ./backend/dist/start.js

EXPOSE 3001

# Use the new startup script
CMD ["node", "backend/dist/start.js"]
