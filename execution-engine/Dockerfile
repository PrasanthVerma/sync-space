# ── Base image ──────────────────────────────────────────────────────────────
# Node.js is the service host; Python & other runtimes are invoked via
# child_process inside ephemeral Docker-in-Docker containers (Dockerfile.node,
# Dockerfile.python).  The host image only needs Node + Docker CLI.
FROM node:20-alpine

# Install Docker CLI so the engine can spawn sibling containers
RUN apk add --no-cache docker-cli

# Security: run as non-root user (added to the docker group so it can talk to
# the Docker socket mounted at runtime via -v /var/run/docker.sock:/var/run/docker.sock)
RUN addgroup -S appgroup \
    && adduser  -S appuser -G appgroup \
    && adduser  appuser docker 2>/dev/null || true

WORKDIR /app

# Install production dependencies (layer-cached unless package files change)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application source and sandbox Dockerfiles
COPY src/           ./src/
COPY Dockerfile.node   ./Dockerfile.node
COPY Dockerfile.python ./Dockerfile.python
COPY setup.sh          ./setup.sh

# Ensure the temp directory exists for code snippet staging
RUN mkdir -p temp && chown -R appuser:appgroup /app

USER appuser

# Expose the port the execution-engine listens on (default 4000)
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=15s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "src/index.js"]
