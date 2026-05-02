const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const connectDB = require('./config/db');
const { setupWebSocket } = require('./socket/yjs');
const roomRoutes = require('./routes/room');
const authRoutes = require('./routes/auth');

dotenv.config();

// Allow requests from any localhost port (Vite uses :5173 by default)
// and any deployed frontend domains listed in CLIENT_ORIGINS env var (comma-separated).
const ALLOWED_ORIGINS = [
    'https://sync-space-ymwm.onrender.com', // Render server (health checks / same-origin)
    'https://sync-space-liart.vercel.app', // Vercel server (health checks / same-origin)
    // Railway health checks don't send Origin; they're allowed via the localhost rule.
    ...(process.env.CLIENT_ORIGINS
        ? process.env.CLIENT_ORIGINS.split(',').map(o => o.trim())
        : []
    )
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        // Allow any localhost / 127.0.0.1 origin during development
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        // Allow any explicitly configured production origin
        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/auth', authRoutes);

// Setup WebSocket for Yjs
setupWebSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
