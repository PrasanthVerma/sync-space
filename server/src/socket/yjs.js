const WebSocket = require('ws');
const Y = require('yjs');
const { setupWSConnection, docs } = require('y-websocket/bin/utils');
const Room = require('../models/Room');

// How long to wait after the last edit before persisting to MongoDB (ms).
// Keeps DB writes low — only saves once the user pauses typing for 5 seconds.
const AUTOSAVE_DEBOUNCE_MS = 5000;

// Track per-room debounce timers so we don't create duplicate timers.
const saveTimers = new Map();

/**
 * Debounced save: waits AUTOSAVE_DEBOUNCE_MS after the last change
 * then writes both the plain-text code and the full binary Yjs state
 * (encodeStateAsUpdate) to MongoDB.
 *
 * Storing the binary Yjs state means that when the server restarts and a
 * new client connects to an empty room, we can call Y.applyUpdate() to
 * perfectly restore the CRDT document — no data loss.
 */
const scheduleSave = (roomId, ytext, ydoc) => {
    // Clear any pending save for this room
    if (saveTimers.has(roomId)) {
        clearTimeout(saveTimers.get(roomId));
    }

    const timer = setTimeout(async () => {
        saveTimers.delete(roomId);
        try {
            const plainText = ytext.toString();
            const snapshot = Buffer.from(Y.encodeStateAsUpdate(ydoc));

            await Room.findOneAndUpdate(
                { roomId },
                {
                    code: plainText,
                    codeSnapshot: snapshot,
                    updatedAt: new Date()
                }
            );
            console.log(`[AutoSave] Room ${roomId} saved (${plainText.length} chars)`);
        } catch (err) {
            console.error(`[AutoSave] Failed to save room ${roomId}:`, err.message);
        }
    }, AUTOSAVE_DEBOUNCE_MS);

    saveTimers.set(roomId, timer);
};

/**
 * Restores a previously saved Yjs binary snapshot into a fresh Y.Doc.
 * Called only when a client connects to a room whose in-memory doc is empty
 * but we have a saved codeSnapshot in MongoDB.
 */
const restoreSnapshot = async (roomId, ydoc) => {
    try {
        const room = await Room.findOne({ roomId }).select('codeSnapshot');
        if (room && room.codeSnapshot && room.codeSnapshot.length > 0) {
            Y.applyUpdate(ydoc, new Uint8Array(room.codeSnapshot));
            console.log(`[Restore] Room ${roomId} restored from MongoDB snapshot`);
        }
    } catch (err) {
        console.error(`[Restore] Failed to restore room ${roomId}:`, err.message);
    }
};

const setupWebSocket = (server) => {
    const wss = new WebSocket.Server({ noServer: true });

    wss.on('connection', async (conn, req) => {
        // Extract roomId from the WebSocket URL path: /yjs/<roomId>
        const roomId = req.url.replace('/yjs/', '').split('?')[0];

        // Check if y-websocket already has this doc in memory
        const existingDoc = docs.get(roomId);
        const isNewDoc = !existingDoc;

        // Let y-websocket handle the CRDT sync protocol
        // We MUST pass docName: roomId so it uses our ID as the key in the docs map,
        // otherwise it defaults to the full path (e.g. /yjs/abc) and our docs.get(roomId) fails.
        setupWSConnection(conn, req, { gc: true, docName: roomId });

        if (isNewDoc) {
            // After setupWSConnection, the doc is now registered in the docs Map.
            // Restore from MongoDB if a snapshot exists.
            const ydoc = docs.get(roomId);
            if (ydoc) {
                await restoreSnapshot(roomId, ydoc);

                // Attach a persistent observer on the shared Y.Text.
                // Every edit triggers a debounced save to MongoDB.
                const ytext = ydoc.getText('monaco');
                ytext.observe(() => {
                    console.log(`[WS] Change detected in room ${roomId}, scheduling save...`);
                    scheduleSave(roomId, ytext, ydoc);
                });

                console.log(`[WS] New Yjs doc initialized and observer attached for room: ${roomId}`);
            } else {
                console.error(`[WS] Failed to get ydoc for room ${roomId} even though it should be new.`);
            }
        } else {
            console.log(`[WS] Client joined existing session for room: ${roomId}`);
        }
    });

    server.on('upgrade', (request, socket, head) => {
        if (request.url.startsWith('/yjs/')) {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        }
    });

    console.log('Yjs WebSocket Server Initialized (with MongoDB auto-save)');
};

module.exports = { setupWebSocket };
