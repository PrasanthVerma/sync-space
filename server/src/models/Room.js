const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    language: {
        type: String,
        default: 'javascript'
    },
    // User who created this room
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Plain-text snapshot of the current code (for quick display / search)
    code: {
        type: String,
        default: ''
    },
    // Binary Yjs encoded state — used to perfectly restore CRDT document
    // on server restart so collaborators see no data loss.
    codeSnapshot: {
        type: Buffer,
        default: null
    },
    participants: [
        {
            socketId: String,
            username: String,
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        }
    ],
    files: [
        {
            name: String,
            type: {
                type: String,
                enum: ['file', 'folder'],
                default: 'file'
            },
            parentId: {
                type: String,
                default: null
            },
            content: {
                type: String,
                default: ''
            }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
