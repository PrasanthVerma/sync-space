import React, { useEffect, useRef } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { useStore } from '../store/useStore';

interface EditorWorkspaceProps {
  roomId: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({ roomId }) => {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

    const { language, setCode, setUsers, username, setUsername, token } = useStore();

    const handleEditorDidMount = async (editor: any, _monaco: any) => {
        editorRef.current = editor;

        // Initialize Yjs Document
        const doc = new Y.Doc();
        const ytext = doc.getText('monaco');

        // Connect to WebSocket server (this triggers server-side restore of snapshot)
        const wsProvider = new WebsocketProvider(
            import.meta.env.VITE_WS_URL || 'ws://localhost:5000/yjs',
            roomId,
            doc
        );
        providerRef.current = wsProvider;

        // Configure Awareness (User Presence)
        let initialName = username;
        if (!initialName) {
            initialName = 'user' + Math.floor(Math.random() * 1000);
            setUsername(initialName);
        }

        const color = '#' + Math.floor(Math.random() * 16777215).toString(16).padEnd(6, '0');
        wsProvider.awareness.setLocalStateField('user', {
            name: initialName,
            color: color
        });

        // Listen to changes in awareness to update the users list
        wsProvider.awareness.on('change', () => {
            const states = wsProvider.awareness.getStates();
            const activeUsers: any[] = [];
            states.forEach((state: any, clientId: number) => {
                if (state.user) {
                    activeUsers.push({
                        clientId,
                        name: state.user.name,
                        color: state.user.color
                    });
                }
            });
            setUsers(activeUsers);
        });

        // Wait for the WebSocket to sync. If the document is still empty after sync
        // (e.g. the very first user to open this room after the server restored the
        // snapshot hasn't propagated yet), fall back to the REST API plain-text code.
        wsProvider.on('sync', async (isSynced: boolean) => {
            if (isSynced && ytext.length === 0) {
                try {
                    const res = await fetch(`${API_URL}/api/rooms/${roomId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const data = await res.json();
                    if (data.success && data.data.code) {
            // Only insert if the doc is still empty — prevents overwriting
            // content that arrived from another peer during the fetch.
            if (ytext.length === 0) {
              doc.transact(() => {
                ytext.insert(0, data.data.code);
              });
            }
          }
        } catch (err) {
          console.error('[EditorWorkspace] Failed to load code snapshot:', err);
        }
      }
    });

    // Bind Yjs to Monaco
    const binding = new MonacoBinding(
      ytext,
      editor.getModel(),
      new Set([editor]),
      wsProvider.awareness
    );
    bindingRef.current = binding;

    // Mirror code changes into Zustand for other components (e.g. TerminalOutput)
    editor.onDidChangeModelContent(() => {
      setCode(editor.getValue());
    });
  };

  useEffect(() => {
    return () => {
      // Cleanup bindings and provider on unmount
      if (bindingRef.current) bindingRef.current.destroy();
      if (providerRef.current) providerRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    if (providerRef.current && username) {
      const state = providerRef.current.awareness.getLocalState();
      if (state && state.user && state.user.name !== username) {
        providerRef.current.awareness.setLocalStateField('user', {
          ...state.user,
          name: username
        });
      }
    }
  }, [username]);

  return (
    <div className="w-full h-full border border-gray-700 rounded overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
        }}
      />
    </div>
  );
};

export default EditorWorkspace;
