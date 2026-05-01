const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    // Legacy password field for migration
    password: {
        type: String,
        select: false
    },
    avatar: {
        type: String,
        default: ''
    },
    settings: {
        theme: {
            type: String,
            default: 'dark'
        },
        editorPreferences: {
            fontSize: { type: Number, default: 14 },
            tabSize: { type: Number, default: 2 },
            fontFamily: { type: String, default: 'Fira Code' }
        }
    },
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
