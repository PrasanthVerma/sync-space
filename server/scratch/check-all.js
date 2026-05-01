const mongoose = require('mongoose');
require('dotenv').config();

const Room = require('../src/models/room.model');
const File = require('../src/models/file.model');
const RoomMember = require('../src/models/roomMember.model');

const checkAll = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const rooms = await Room.find({});
        console.log('Rooms:', rooms.length);
        rooms.forEach(r => console.log(`  - Room: ${r.name} (${r._id}), root: ${r.rootFolderId}`));

        const files = await File.find({});
        console.log('Files:', files.length);
        files.forEach(f => console.log(`  - File: ${f.name} (${f._id}), type: ${f.type}, parent: ${f.parentId}, room: ${f.roomId}`));

        const members = await RoomMember.find({});
        console.log('Members:', members.length);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkAll();
