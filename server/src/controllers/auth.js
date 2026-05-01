const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
        expiresIn: '1h',
    });
};

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide all fields' });
        }

        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ success: false, error: 'User with this email or username already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            email,
            passwordHash
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            data: { 
                _id: user._id, 
                username: user.username, 
                email: user.email 
            },
            token
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Handle legacy users who might have 'password' instead of 'passwordHash'
        const hash = user.passwordHash || user.password;
        if (!hash) {
            return res.status(401).json({ success: false, error: 'Account needs migration or password reset' });
        }

        const isMatch = await bcrypt.compare(password, hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Auto-migrate legacy users
        let needsSave = false;
        if (!user.passwordHash && user.password) {
            user.passwordHash = user.password;
            user.password = undefined;
            needsSave = true;
        }

        if (!user.username) {
            user.username = user.email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
            needsSave = true;
        }

        user.lastLogin = Date.now();
        await user.save();

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            data: { _id: user._id, username: user.username, email: user.email },
            token
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const logoutUser = async (req, res) => {
    try {
        const token = req.token;
        if (!token) {
            return res.status(400).json({ success: false, error: 'No token provided' });
        }

        // Add to Redis blacklist (if Redis is available)
        if (redisClient.isConnected()) {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                const ttl = decoded.exp - Math.floor(Date.now() / 1000);
                if (ttl > 0) {
                    await redisClient.setex(`bl_${token}`, ttl, 'true');
                }
            }
        }

        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        res.status(200).json({ success: true, data: req.user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getMe
};
