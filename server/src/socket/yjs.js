const WebSocket = require('ws');
const Y = require('yjs');
const { setupWSConnection, docs } = require('y-websocket/bin/utils');
const fileService = require('../services/file.service');

const AUTOSAVE_DEBOUNCE_MS = 5000;
const saveTimers = new Map();

const scheduleSave = (fileId, ydoc) => {
    if (saveTimers.has(fileId)) {
        clearTimeout(saveTimers.get(fileId));
    }

    const timer = setTimeout(async () => {
        saveTimers.delete(fileId);
        try {
            const update = Buffer.from(Y.encodeStateAsUpdate(ydoc));
            await fileService.appendUpdate(fileId, update);
        } catch (err) {
            console.error(`[AutoSave] Failed to save file ${fileId}:`, err.message);
        }
    }, AUTOSAVE_DEBOUNCE_MS);

    saveTimers.set(fileId, timer);
};

const restoreSnapshot = async (fileId, ydoc) => {
    try {
        const updates = await fileService.getFileUpdates(fileId);
        if (updates && updates.length > 0) {
            updates.forEach(u => {
                const buffer = u.update.buffer || u.update;
                Y.applyUpdate(ydoc, new Uint8Array(buffer));
            });
        }
    } catch (err) {
        console.error(`[Restore] Failed to restore file ${fileId}:`, err.message);
    }
};

const setupWebSocket = (server) => {
    const wss = new WebSocket.Server({ noServer: true });

    wss.on('connection', async (conn, req) => {
        const fileId = req.url.replace('/yjs/', '').split('?')[0];

        if (!fileId || fileId === 'yjs') {
            conn.close();
            return;
        }

        const isNewDoc = !docs.get(fileId);
        setupWSConnection(conn, req, { gc: true, docName: fileId });

        if (isNewDoc) {
            const ydoc = docs.get(fileId);
            if (ydoc) {
                await restoreSnapshot(fileId, ydoc);
                ydoc.getText('monaco').observe(() => scheduleSave(fileId, ydoc));
            }
        }
    });

    server.on('upgrade', (request, socket, head) => {
        if (request.url.startsWith('/yjs/')) {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
            socket.destroy();
        }
    });

    console.log('Yjs WebSocket Server ready');
};

module.exports = { setupWebSocket };
