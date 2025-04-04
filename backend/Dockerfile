FROM --platform=linux/amd64 node:20-slim

WORKDIR /usr/src/app

# Install dependencies required for building native modules
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    python3 && \
    rm -rf /var/lib/apt/lists/*

# Copy package files and prisma
COPY package*.json ./
COPY prisma ./prisma

# Install dependencies with specific approach for native modules
RUN npm ci --omit=dev --ignore-scripts && \
    npm install bcrypt --build-from-source && \
    npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create non-root user
RUN useradd -m appuser
RUN chown -R appuser:appuser /usr/src/app

# Switch to non-root user
USER appuser

# Environment and port
ENV NODE_ENV=production
EXPOSE 3001

# Start command with prisma setup
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/index.js"]
