const mongoose = require('mongoose');
require('dotenv').config();

const File = require('../src/models/file.model');
const Room = require('../src/models/room.model');

const checkFiles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const rooms = await Room.find({});
        console.log('Rooms:', rooms.map(r => ({ id: r._id, name: r.name, root: r.rootFolderId })));

        const files = await File.find({});
        console.log('Files in DB:', JSON.stringify(files, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkFiles();
