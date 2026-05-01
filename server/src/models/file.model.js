const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['file', 'folder'],
        required: true
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        index: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        default: null,
        index: true
    },
    path: {
        type: String,
        required: true,
        index: true
    },
    depth: {
        type: Number,
        default: 0
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    meta: {
        language: { type: String, default: 'plaintext' },
        size: { type: Number, default: 0 }
    }
}, { timestamps: true });

// Indexes for performance
fileSchema.index({ roomId: 1, parentId: 1 });
fileSchema.index({ roomId: 1, path: 1 });
fileSchema.index({ roomId: 1, isDeleted: 1 });

module.exports = mongoose.model('File', fileSchema);
