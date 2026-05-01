const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    rootFolderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
