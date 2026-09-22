# =========================
# Stage 1: Build application
# =========================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build NestJS
RUN npm run build


# =========================
# Stage 2: Production
# =========================
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy EJS views
COPY --from=builder /app/views ./views

# Copy public files
COPY --from=builder /app/public ./public

# Application port
EXPOSE 3000

# Start application
CMD ["node", "dist/main"]