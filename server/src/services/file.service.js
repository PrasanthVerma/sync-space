const File = require('../models/file.model');
const FileContent = require('../models/fileContent.model');
const FileVersion = require('../models/fileVersion.model');
const mongoose = require('mongoose');

const createFile = async (name, type, parentId, roomId, userId) => {
    let path = `/${name}`;
    let depth = 0;

    if (parentId) {
        const parent = await File.findById(parentId);
        if (parent) {
            path = `${parent.path}/${name}`;
            depth = parent.depth + 1;
        }
    }

    const file = new File({
        name,
        type,
        parentId,
        roomId,
        path,
        depth,
        createdBy: userId,
        updatedBy: userId
    });

    return await file.save();
};

const getFolderContents = async (parentId, roomId) => {
    console.log('[FileService] getFolderContents - parentId:', parentId, 'roomId:', roomId);
    
    // Ensure we are using ObjectIds for the query
    const query = {
        roomId: new mongoose.Types.ObjectId(roomId),
        isDeleted: false
    };

    if (parentId) {
        query.parentId = new mongoose.Types.ObjectId(parentId);
    } else {
        // If no parentId provided, look for root level files
        query.parentId = null;
    }
    
    console.log('[FileService] Query:', JSON.stringify(query));
    
    const results = await File.find(query).sort({ type: 1, name: 1 }).lean();
    console.log('[FileService] Found', results.length, 'files');
    return results;
};

const moveFile = async (fileId, newParentId) => {
    const file = await File.findById(fileId);
    if (!file) throw new Error('File not found');

    let newPath = `/${file.name}`;
    let newDepth = 0;

    if (newParentId) {
        const newParent = await File.findById(newParentId);
        if (newParent) {
            newPath = `${newParent.path}/${file.name}`;
            newDepth = newParent.depth + 1;
        }
    }

    // If it's a folder, we need to update all children paths recursively
    if (file.type === 'folder') {
        const oldPath = file.path;
        const children = await File.find({ roomId: file.roomId, path: new RegExp(`^${oldPath}/`) });
        
        for (const child of children) {
            child.path = child.path.replace(oldPath, newPath);
            child.depth = child.depth + (newDepth - file.depth);
            await child.save();
        }
    }

    file.parentId = newParentId;
    file.path = newPath;
    file.depth = newDepth;
    return await file.save();
};

const softDeleteFile = async (fileId) => {
    const file = await File.findById(fileId);
    if (!file) throw new Error('File not found');

    file.isDeleted = true;
    
    // If folder, soft delete all contents
    if (file.type === 'folder') {
        await File.updateMany(
            { roomId: file.roomId, path: new RegExp(`^${file.path}/`) },
            { isDeleted: true }
        );
    }

    return await file.save();
};

const renameFile = async (fileId, newName) => {
    const file = await File.findById(fileId);
    if (!file) throw new Error('File not found');

    const oldPath = file.path;
    const pathParts = oldPath.split('/');
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join('/');

    if (file.type === 'folder') {
        const children = await File.find({ roomId: file.roomId, path: new RegExp(`^${oldPath}/`) });
        for (const child of children) {
            child.path = child.path.replace(oldPath, newPath);
            await child.save();
        }
    }

    file.name = newName;
    file.path = newPath;
    return await file.save();
};

// CRDT Content methods
const appendUpdate = async (fileId, binaryUpdate) => {
    // Get latest version
    const lastUpdate = await FileContent.findOne({ fileId }).sort({ version: -1 });
    const nextVersion = lastUpdate ? lastUpdate.version + 1 : 1;

    const newUpdate = new FileContent({
        fileId,
        update: binaryUpdate,
        version: nextVersion
    });

    return await newUpdate.save();
};

const getFileUpdates = async (fileId) => {
    return await FileContent.find({ fileId }).sort({ version: 1 }).lean();
};

const createSnapshot = async (fileId, snapshotBinary, versionLabel, userId) => {
    const snapshot = new FileVersion({
        fileId,
        snapshot: snapshotBinary,
        versionLabel,
        createdBy: userId
    });

    return await snapshot.save();
};

module.exports = {
    createFile,
    getFolderContents,
    moveFile,
    softDeleteFile,
    renameFile,
    appendUpdate,
    getFileUpdates,
    createSnapshot
};
