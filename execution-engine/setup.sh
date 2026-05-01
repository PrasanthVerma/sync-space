#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# SyncSpace Execution Engine — Sandbox Image Setup
# Run this ONCE before starting the execution engine.
# ─────────────────────────────────────────────────────────────────

set -e  # Exit immediately on any error

echo "🔨 Building Node.js sandbox image..."
docker build -t syncspace-runner-node:latest -f Dockerfile.node .

echo "🔨 Building Python sandbox image..."
docker build -t syncspace-runner-python:latest -f Dockerfile.python .

echo "✅ Sandbox images ready:"
docker images | grep syncspace-runner
