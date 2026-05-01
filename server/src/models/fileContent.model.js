const mongoose = require('mongoose');

const fileContentSchema = new mongoose.Schema({
    fileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true,
        index: true
    },
    update: {
        type: Buffer, // Yjs binary update
        required: true
    },
    version: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for quick retrieval of updates in sequence
fileContentSchema.index({ fileId: 1, version: 1 });

module.exports = mongoose.model('FileContent', fileContentSchema);
