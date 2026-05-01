const WebSocket = require('ws');
const Y = require('yjs');
const { setupWSConnection, docs } = require('y-websocket/bin/utils');
const fileService = require('../services/file.service');
const File = require('../models/file.model');

const AUTOSAVE_DEBOUNCE_MS = 5000;
const saveTimers = new Map();

/**
 * Debounced save: waits AUTOSAVE_DEBOUNCE_MS after the last change
 * then writes the binary Yjs updates to MongoDB (FileContent).
 */
const scheduleSave = (fileId, ydoc) => {
    if (saveTimers.has(fileId)) {
        clearTimeout(saveTimers.get(fileId));
    }

    const timer = setTimeout(async () => {
        saveTimers.delete(fileId);
        try {
            // Encode the full state as a single update for now, or we could diff it.
            // Yjs-websocket normally broadcasts updates.
            // Here we save the state snapshot to FileContent versioning.
            const update = Buffer.from(Y.encodeStateAsUpdate(ydoc));
            
            // Append as a new update/version
            await fileService.appendUpdate(fileId, update);
            
            console.log(`[AutoSave] File ${fileId} saved`);
        } catch (err) {
            console.error(`[AutoSave] Failed to save file ${fileId}:`, err.message);
        }
    }, AUTOSAVE_DEBOUNCE_MS);

    saveTimers.set(fileId, timer);
};

/**
 * Restores a previously saved Yjs binary updates into a fresh Y.Doc.
 */
const restoreSnapshot = async (fileId, ydoc) => {
    try {
        const updates = await fileService.getFileUpdates(fileId);
        if (updates && updates.length > 0) {
            updates.forEach(u => {
                Y.applyUpdate(ydoc, new Uint8Array(u.update));
            });
            console.log(`[Restore] File ${fileId} restored from ${updates.length} updates`);
        }
    } catch (err) {
        console.error(`[Restore] Failed to restore file ${fileId}:`, err.message);
    }
};

const setupWebSocket = (server) => {
    const wss = new WebSocket.Server({ noServer: true });

    wss.on('connection', async (conn, req) => {
        // The URL is now expected to be /yjs/:fileId
        const fileId = req.url.replace('/yjs/', '').split('?')[0];

        if (!fileId || fileId === 'yjs') {
            console.error('[WS] Invalid fileId connected');
            conn.close();
            return;
        }

        const existingDoc = docs.get(fileId);
        const isNewDoc = !existingDoc;

        setupWSConnection(conn, req, { gc: true, docName: fileId });

        if (isNewDoc) {
            const ydoc = docs.get(fileId);
            if (ydoc) {
                await restoreSnapshot(fileId, ydoc);

                const ytext = ydoc.getText('monaco');
                ytext.observe(() => {
                    scheduleSave(fileId, ydoc);
                });

                console.log(`[WS] New Yjs doc initialized for file: ${fileId}`);
            }
        }
    });

    server.on('upgrade', (request, socket, head) => {
        if (request.url.startsWith('/yjs/')) {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        }
    });

    console.log('Yjs WebSocket Server Initialized (with File-based auto-save)');
};

module.exports = { setupWebSocket };
