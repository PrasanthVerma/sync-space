# ── Base image ──────────────────────────────────────────────────────────────
FROM node:20-alpine

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install production dependencies only (layer-cached unless package files change)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source files
COPY src/ ./src/

# Switch to non-root user
USER appuser

# Expose the port the Express server listens on (default 5000)
EXPOSE 5000

# Health check – adjust path/port to match your server's health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "src/index.js"]
