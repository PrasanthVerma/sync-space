const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        sparse: true
    },
    // Legacy field to support old room identifiers
    roomId: {
        type: String,
        unique: true,
        sparse: true
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

// Cascade delete: remove members and files when a room is deleted
roomSchema.pre('remove', async function(next) {
    const RoomMember = mongoose.model('RoomMember');
    const File = mongoose.model('File');
    
    await RoomMember.deleteMany({ roomId: this._id });
    await File.deleteMany({ roomId: this._id });
    next();
});

module.exports = mongoose.model('Room', roomSchema);
