# SyncSpace

A production-grade real-time collaborative code editor with an isolated execution sandbox.

## Architecture

- **Frontend (`client/`)**: React, Vite, Tailwind CSS, Zustand, Monaco Editor, Yjs.
- **Backend (`server/`)**: Node.js, Express, WebSockets for Yjs, MongoDB via Mongoose.
- **Execution Engine (`execution-engine/`)**: Node.js APIs to spawn short-lived Docker containers (`syncspace-runner-node`, `syncspace-runner-python`) for secure code execution.

## Prerequisites

- Node.js (v18+)
- MongoDB (running locally or via Docker Compose)
- Docker (required for the Execution Engine)

## Setup Instructions

### 1. Start Support Services (MongoDB)
```bash
docker-compose up -d
```

### 2. Configure Backend Configuration
In `server/.env`, configure your options if they differ:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/syncspace
```

### 3. Build Sandbox Images (Execution Engine)
In `execution-engine/`:
```bash
docker build -t syncspace-runner-node:latest -f Dockerfile.node .
docker build -t syncspace-runner-python:latest -f Dockerfile.python .
```

### 4. Run Services
You will need 3 separate terminal tabs:

**Tab 1: Backend Server**
```bash
cd server
npm i
npm run dev
```

**Tab 2: Execution Engine**
```bash
cd execution-engine
npm i
npm start
```

**Tab 3: Frontend Client**
```bash
cd client
npm i
npm run dev
```

## Features

- **Real-Time Synergy**: CRDT-based synchronized text editing using Yjs mapped to Monaco Editor over WebSockets.
- **Isolated Execution**: Untrusted code securely executed inside temporary, memory-limited Docker containers.
- **Beautiful UI**: Built with Tailwind CSS and Lucide React icons, adhering to modern UI standards.
