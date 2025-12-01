# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Set environment variable
ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm ci --omit=dev --ignore-scripts

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin

# Expose port
EXPOSE 3000

# Set hostname to listen on all interfaces
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Run the application
CMD ["npm", "start"]
