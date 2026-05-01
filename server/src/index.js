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
// and any deployed frontend domain set in CLIENT_ORIGIN env var.
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        // Allow any localhost / 127.0.0.1 origin during development
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        // Allow explicitly configured production frontend
        if (process.env.CLIENT_ORIGIN && origin === process.env.CLIENT_ORIGIN) {
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
