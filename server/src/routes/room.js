const express = require('express');
const { createRoom, getRoomDetails } = require('../controllers/room');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Create a new room
router.post('/create', protect, createRoom);

// Get room details
router.get('/:roomId', protect, getRoomDetails);

module.exports = router;
