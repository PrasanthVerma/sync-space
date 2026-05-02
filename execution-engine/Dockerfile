FROM node:20-alpine

# python3 — needed to execute Python code directly via child_process
RUN apk add --no-cache python3

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application source
COPY src/ ./src/

# Copy sandbox Dockerfiles and setup script
COPY Dockerfile.node   ./Dockerfile.node
COPY Dockerfile.python ./Dockerfile.python
COPY setup.sh          ./setup.sh

# Create temp directory for code staging
RUN mkdir -p temp

EXPOSE 4000

CMD ["node", "src/index.js"]
