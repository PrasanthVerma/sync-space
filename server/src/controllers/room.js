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
                files: room.files || [],
                participants: room.participants || [],
                createdAt: room.createdAt,
                updatedAt: room.updatedAt
            }
        });
    } catch (error) {
        console.error('Get Room Details Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
// @desc    Get all rooms for the authenticated user
// @route   GET /api/rooms/user-rooms
// @access  Private
const getUserRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ 
            $or: [
                { createdBy: req.user._id },
                { 'participants.userId': req.user._id }
            ]
        }).sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            data: rooms
        });
    } catch (error) {
        console.error('Get User Rooms Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Add a file or folder to a room
// @route   POST /api/rooms/:roomId/files
// @access  Private
const createFile = async (req, res) => {
    try {
        const { name, type, parentId } = req.body;
        const room = await Room.findOne({ roomId: req.params.roomId });

        if (!room) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        room.files.push({ name, type, parentId });
        await room.save();

        res.status(201).json({
            success: true,
            data: room.files[room.files.length - 1]
        });
    } catch (error) {
        console.error('Create File Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get all files for a room
// @route   GET /api/rooms/:roomId/files
// @access  Private
const getRoomFiles = async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId });

        if (!room) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        res.status(200).json({
            success: true,
            data: room.files
        });
    } catch (error) {
        console.error('Get Room Files Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

module.exports = {
    createRoom,
    getRoomDetails,
    getUserRooms,
    createFile,
    getRoomFiles
};
