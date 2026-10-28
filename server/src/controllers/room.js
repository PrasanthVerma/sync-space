const roomService = require('../services/room.service');
const fileService = require('../services/file.service');
const Room = require('../models/room.model');
const RoomMember = require('../models/roomMember.model');
const mongoose = require('mongoose');

const resolveRoom = async (roomId) => {
    let room = null;
    if (mongoose.Types.ObjectId.isValid(roomId)) {
        room = await Room.findById(roomId);
    }
    if (!room) {
        room = await Room.findOne({ $or: [{ name: roomId }, { roomId: roomId }] });
    }
    return room;
};

const createRoom = async (req, res) => {
    try {
        const { name, isPublic } = req.body;
        const ownerId = req.user._id;
        const roomName = name || `Room-${Math.random().toString(36).substring(2, 8)}`;
        const room = await roomService.createRoom(roomName, ownerId, isPublic);
        res.status(201).json({ success: true, data: room });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || 'Server Error' });
    }
};

const getRoomDetails = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const userId = req.user._id;

        const room = await resolveRoom(roomId);
        if (!room) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        const members = await RoomMember.find({ roomId: room._id }).populate('userId', 'username email avatar').lean();
        const membership = members.find(m => m.userId._id.toString() === userId.toString());

        if (!membership && !room.isPublic) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const roomData = {
            ...room.toObject(),
            _id: room._id.toString(),
            id: room._id.toString(),
            participants: members.map(m => ({ ...m.userId, role: m.role })),
            userRole: membership ? membership.role : 'viewer'
        };

        res.status(200).json({ success: true, data: roomData });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

const getUserRooms = async (req, res) => {
    try {
        const userId = req.user._id;
        const memberships = await RoomMember.find({ userId }).populate({
            path: 'roomId',
            populate: { path: 'ownerId', select: 'username email' }
        });

        const rooms = memberships
            .filter(m => m.roomId && typeof m.roomId.toObject === 'function')
            .map(m => {
                const roomObj = m.roomId.toObject();
                return { ...roomObj, _id: roomObj._id.toString(), id: roomObj._id.toString(), userRole: m.role };
            });

        res.status(200).json({ success: true, data: rooms });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

const createFile = async (req, res) => {
    try {
        const { name, type, parentId } = req.body;
        const roomId = req.params.roomId;
        const userId = req.user._id;

        const room = await resolveRoom(roomId);
        if (!room) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        const canEdit = await roomService.checkPermission(room._id, userId, 'edit');
        if (!canEdit) {
            return res.status(403).json({ success: false, error: 'Permission denied' });
        }

        const targetParentId = parentId || room.rootFolderId;
        const file = await fileService.createFile(name, type, targetParentId, room._id, userId);
        res.status(201).json({ success: true, data: file });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

const getRoomFiles = async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const { parentId } = req.query;

        const room = await resolveRoom(roomId);
        if (!room) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        const folderId = parentId || room.rootFolderId || null;
        const files = await fileService.getFolderContents(folderId, room._id);
        res.status(200).json({ success: true, data: files });
    } catch (error) {
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
