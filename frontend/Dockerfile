# ============================================
# Development Dockerfile for Next.js
# This uses bind mounts from docker-compose
# ============================================
FROM node:20-alpine

WORKDIR /app

# Install dependencies for development
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (npm install for development lock file flexibility)
RUN npm install

# Expose port
EXPOSE 3000

# Development server with hot reload
CMD ["npm", "run", "dev"]
