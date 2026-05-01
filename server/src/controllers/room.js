const roomService = require('../services/room.service');
const fileService = require('../services/file.service');
const Room = require('../models/room.model');
const RoomMember = require('../models/roomMember.model');
const File = require('../models/file.model');

// @desc    Create a new collaborative room
// @route   POST /api/rooms/create
// @access  Private
const createRoom = async (req, res) => {
    try {
        const { name, isPublic } = req.body;
        const ownerId = req.user._id;

        const roomName = name || `Room-${Math.random().toString(36).substring(2, 8)}`;
        const room = await roomService.createRoom(roomName, ownerId, isPublic);

        res.status(201).json({
            success: true,
            data: room
        });
    } catch (error) {
        console.error('Create Room Error:', error);
        res.status(500).json({ success: false, error: error.message || 'Server Error' });
    }
};

// @desc    Get room details
// @route   GET /api/rooms/:roomId
// @access  Private
const getRoomDetails = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const userId = req.user._id;

        const room = await roomService.getRoomDetails(roomId);
        if (!room) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        // Get members
        const members = await RoomMember.find({ roomId }).populate('userId', 'username email avatar').lean();

        // Check if user is a member
        const membership = members.find(m => m.userId._id.toString() === userId.toString());
        if (!membership && !room.isPublic) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        res.status(200).json({
            success: true,
            data: {
                ...room,
                participants: members.map(m => ({
                    userId: m.userId._id,
                    username: m.userId.username,
                    email: m.userId.email,
                    avatar: m.userId.avatar,
                    role: m.role
                })),
                userRole: membership ? membership.role : 'viewer'
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
        const userId = req.user._id;
        const memberships = await RoomMember.find({ userId }).populate({
            path: 'roomId',
            populate: { path: 'ownerId', select: 'username email' }
        });

        const rooms = memberships.map(m => ({
            ...m.roomId.toObject(),
            userRole: m.role
        }));

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
        const roomId = req.params.roomId;
        const userId = req.user._id;

        // Check permissions
        const canEdit = await roomService.checkPermission(roomId, userId, 'edit');
        if (!canEdit) {
            return res.status(403).json({ success: false, error: 'Permission denied' });
        }

        // If parentId is not provided, use rootFolderId
        let targetParentId = parentId;
        if (!targetParentId) {
            const room = await Room.findById(roomId);
            targetParentId = room.rootFolderId;
        }

        const file = await fileService.createFile(name, type, targetParentId, roomId, userId);

        res.status(201).json({
            success: true,
            data: file
        });
    } catch (error) {
        console.error('Create File Error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get all files for a room (hierarchical)
// @route   GET /api/rooms/:roomId/files
// @access  Private
const getRoomFiles = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const { parentId } = req.query;

        // If parentId is not provided, get root files
        const folderId = parentId || (await Room.findById(roomId)).rootFolderId;

        const files = await fileService.getFolderContents(folderId, roomId);

        res.status(200).json({
            success: true,
            data: files
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
