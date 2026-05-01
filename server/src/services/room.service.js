const Room = require('../models/room.model');
const RoomMember = require('../models/roomMember.model');
const File = require('../models/file.model');

const createRoom = async (name, ownerId, isPublic = false) => {
    console.log('[RoomService] Creating room:', name, 'for owner:', ownerId);
    const room = new Room({
        name,
        ownerId,
        isPublic
    });

    const savedRoom = await room.save();
    console.log('[RoomService] Room saved:', savedRoom._id);

    // Create owner as a member
    await RoomMember.create({
        roomId: savedRoom._id,
        userId: ownerId,
        role: 'owner',
        permissions: {
            canEdit: true,
            canDelete: true,
            canInvite: true
        }
    });
    console.log('[RoomService] Owner added as member');

    // Create root folder for the room
    const rootFolder = new File({
        name: 'root',
        type: 'folder',
        roomId: savedRoom._id,
        path: '/',
        depth: 0,
        createdBy: ownerId
    });

    console.log('[RoomService] Saving root folder...');
    const savedRoot = await rootFolder.save();
    console.log('[RoomService] Root folder saved:', savedRoot._id);
    
    // Update room with rootFolderId using findByIdAndUpdate for reliability
    const finalRoom = await Room.findByIdAndUpdate(
        savedRoom._id,
        { rootFolderId: savedRoot._id },
        { new: true }
    );
    console.log('[RoomService] Room updated with rootFolderId');

    return finalRoom;
};

const getRoomDetails = async (roomId) => {
    return await Room.findById(roomId).populate('ownerId', 'username email avatar').lean();
};

const addMember = async (roomId, userId, role = 'viewer') => {
    const permissions = {
        canEdit: role === 'editor' || role === 'owner',
        canDelete: role === 'owner',
        canInvite: role === 'owner'
    };

    return await RoomMember.findOneAndUpdate(
        { roomId, userId },
        { roomId, userId, role, permissions },
        { upsert: true, new: true }
    );
};

const checkPermission = async (roomId, userId, action) => {
    const member = await RoomMember.findOne({ roomId, userId });
    if (!member) return false;

    if (action === 'edit') return member.permissions.canEdit;
    if (action === 'delete') return member.permissions.canDelete;
    if (action === 'invite') return member.permissions.canInvite;
    
    return true; // viewer access
};

module.exports = {
    createRoom,
    getRoomDetails,
    addMember,
    checkPermission
};
