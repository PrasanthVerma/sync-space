const mongoose = require('mongoose');

const roomMemberSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['owner', 'editor', 'viewer'],
        default: 'viewer'
    },
    permissions: {
        canEdit: { type: Boolean, default: false },
        canDelete: { type: Boolean, default: false },
        canInvite: { type: Boolean, default: false }
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Compound unique index to prevent duplicate memberships
roomMemberSchema.index({ roomId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('RoomMember', roomMemberSchema);
