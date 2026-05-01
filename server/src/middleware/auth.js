const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    console.log('[Auth] Authorization header:', req.headers.authorization?.slice(0, 30) + '...');

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        console.warn('[Auth] Rejected: No token in Authorization header');
        return res.status(401).json({ success: false, error: 'Not authorized, no token' });
    }

    try {
        // Check if token is blacklisted in Redis (if Redis is available)
        if (redisClient.isConnected()) {
            const isBlacklisted = await redisClient.get(`bl_${token}`);
            if (isBlacklisted) {
                console.warn('[Auth] Rejected: Token is blacklisted');
                return res.status(401).json({ success: false, error: 'Token is invalid/blacklisted' });
            }
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');

        // Attach user to req
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            console.warn('[Auth] Rejected: User not found for id', decoded.id);
            return res.status(401).json({ success: false, error: 'Not authorized, user not found' });
        }

        req.token = token;
        next();
    } catch (error) {
        console.warn('[Auth] Rejected: Token verification failed —', error.message);
        res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
};

module.exports = { protect };

