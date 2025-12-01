# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (skip prepare scripts to avoid husky)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Set environment to production for build
ENV NODE_ENV=production

# Build the application
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Set environment variable
ENV NODE_ENV=production

ENV HOST=0.0.0.0

ENV PORT=3000

# Create a non-root user first
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy standalone output from builder (includes server.js and node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Run the application using standalone server
CMD ["node", "server.js"]
