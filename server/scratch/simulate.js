const mongoose = require('mongoose');
require('dotenv').config();

const Room = require('../src/models/room.model');
const File = require('../src/models/file.model');
const RoomMember = require('../src/models/roomMember.model');
const roomService = require('../src/services/room.service');
const fileService = require('../src/services/file.service');

const simulate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Create a room
        const roomName = 'TestRoom-' + Date.now();
        const ownerId = new mongoose.Types.ObjectId();
        console.log('Creating room...');
        const room = await roomService.createRoom(roomName, ownerId);
        console.log('Room created:', room._id, 'RootFolderId:', room.rootFolderId);

        // Create a file
        console.log('Creating file...');
        const file = await fileService.createFile('test.js', 'file', room.rootFolderId, room._id, ownerId);
        console.log('File created:', file._id, 'ParentId:', file.parentId);

        // Fetch files
        console.log('Fetching files for root folder...');
        const files = await fileService.getFolderContents(room.rootFolderId, room._id);
        console.log('Files found:', files.length);
        if (files.length > 0) {
            console.log('First file name:', files[0].name);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

simulate();
