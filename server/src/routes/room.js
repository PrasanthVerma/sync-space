const express = require('express');
const { createRoom, getRoomDetails, getUserRooms, createFile, getRoomFiles } = require('../controllers/room');
const fileService = require('../services/file.service');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get all rooms for user
router.get('/user-rooms', protect, getUserRooms);

// Create a new room
router.post('/create', protect, createRoom);

// Get room details
router.get('/:roomId', protect, getRoomDetails);

// Files in room
router.post('/:roomId/files', protect, createFile);
router.get('/:roomId/files', protect, getRoomFiles);
router.patch('/:roomId/files/:fileId/move', protect, async (req, res) => {
    try {
        const { newParentId } = req.body;
        const file = await fileService.moveFile(req.params.fileId, newParentId);
        res.json({ success: true, data: file });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.delete('/:roomId/files/:fileId', protect, async (req, res) => {
    try {
        await fileService.softDeleteFile(req.params.fileId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
