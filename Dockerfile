# LocalAI Chat PWA with Companion Server
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Copy package files for PWA
COPY package.json ./
COPY package-lock.json* ./

# Install ALL dependencies (needed for build)
RUN npm ci

# Copy PWA source
COPY . .

# Build the PWA
RUN npm run build

# Clean up dev dependencies after build
RUN npm prune --production

# Copy server package.json and install server dependencies
COPY server/package.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

# Copy server source
COPY server/server.js ./

# Create data directory
RUN mkdir -p data

# Set proper permissions
RUN chown -R node:node /app

# Switch to node user for security
USER node

# Expose port
EXPOSE 5174

# Environment variables
ENV NODE_ENV=production
ENV PORT=5174
ENV HOST=0.0.0.0
ENV DATA_DIR=/app/server/data
ENV STATIC_DIR=/app/dist

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5174/api/health || exit 1

# Start the companion server (which also serves the PWA)
CMD ["node", "server.js"]