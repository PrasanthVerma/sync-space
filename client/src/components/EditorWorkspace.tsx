import React, { useEffect, useRef } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { useStore } from '../store/useStore';

interface EditorWorkspaceProps {
  roomId: string;
  fileId?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({ roomId, fileId }) => {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

    const { language, setCode, setUsers, username, setUsername, token } = useStore();

    useEffect(() => {
        if (!monaco || !editorRef.current || !fileId) return;

        // Cleanup previous binding and provider
        if (bindingRef.current) bindingRef.current.destroy();
        if (providerRef.current) providerRef.current.destroy();

        const doc = new Y.Doc();
        const ytext = doc.getText('monaco');

        const wsProvider = new WebsocketProvider(
            import.meta.env.VITE_WS_URL || 'ws://localhost:5000/yjs',
            fileId,
            doc
        );
        providerRef.current = wsProvider;

        const color = '#' + Math.floor(Math.random() * 16777215).toString(16).padEnd(6, '0');
        wsProvider.awareness.setLocalStateField('user', {
            name: username || 'Anonymous',
            color: color
        });

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

        const binding = new MonacoBinding(
            ytext,
            editorRef.current.getModel(),
            new Set([editorRef.current]),
            wsProvider.awareness
        );
        bindingRef.current = binding;

        return () => {
            if (bindingRef.current) bindingRef.current.destroy();
            if (providerRef.current) providerRef.current.destroy();
        };
    }, [fileId, monaco]);

    const handleEditorDidMount = async (editor: any, _monaco: any) => {
        editorRef.current = editor;
        
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
