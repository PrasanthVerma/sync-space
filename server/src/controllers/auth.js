const User = require('../models/User');
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
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide all fields' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            data: { 
                _id: user._id, 
                name: user.name, 
                email: user.email 
            },
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

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            data: { _id: user._id, name: user.name, email: user.email },
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
