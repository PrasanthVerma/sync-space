const express = require('express');
const { createRoom, getRoomDetails, getUserRooms, createFile, getRoomFiles } = require('../controllers/room');
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

module.exports = router;
