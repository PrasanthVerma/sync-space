const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const connectDB = require('./config/db');
const { setupWebSocket } = require('./socket/yjs');
const roomRoutes = require('./routes/room');
const authRoutes = require('./routes/auth');

dotenv.config();

const ALLOWED_ORIGINS = [
    'https://sync-space-ymwm.onrender.com',
    'https://sync-space-liart.vercel.app',
    ...(process.env.CLIENT_ORIGINS
        ? process.env.CLIENT_ORIGINS.split(',').map(o => o.trim())
        : []
    )
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

connectDB();

const app = express();
const server = http.createServer(app);

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/rooms', roomRoutes);
app.use('/api/auth', authRoutes);

setupWebSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
