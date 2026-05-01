const Room = require('../models/Room');
const crypto = require('crypto');

// @desc    Create a new collaborative room
// @route   POST /api/rooms/create
// @access  Private (requires auth)
const createRoom = async (req, res) => {
    try {
        const { language } = req.body;

        // Generate a random room ID
        const roomId = crypto.randomBytes(4).toString('hex');

        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }

        const room = await Room.create({
            roomId,
            language: language || 'javascript',
            createdBy: req.user._id,
            participants: []
        });

        res.status(201).json({
            success: true,
            data: room
        });
    } catch (error) {
        console.error('Create Room Error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server Error' });
    }
};

// @desc    Get room details (includes saved code snapshot)
// @route   GET /api/rooms/:roomId
// @access  Public
const getRoomDetails = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId })
            .populate('createdBy', 'name email');

        if (!room) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }


        console.log(room)
        res.status(200).json({
            success: true,
            data: {
                roomId: room.roomId,
                language: room.language,
                createdBy: room.createdBy,
                code: room.code || '',          // plain-text snapshot for the client
                createdAt: room.createdAt,
                updatedAt: room.updatedAt
            }
        });
    } catch (error) {
        console.error('Get Room Details Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

module.exports = {
    createRoom,
    getRoomDetails
};
