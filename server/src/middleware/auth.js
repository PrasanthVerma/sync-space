const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const User = require('../models/user.model');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, error: 'Not authorized, no token' });
    }

    try {
        if (redisClient.isConnected()) {
            const isBlacklisted = await redisClient.get(`bl_${token}`);
            if (isBlacklisted) {
                return res.status(401).json({ success: false, error: 'Token is invalid/blacklisted' });
            }
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        req.user = await User.findById(decoded.id).select('-passwordHash');

        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Not authorized, user not found' });
        }

        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
};

module.exports = { protect };
