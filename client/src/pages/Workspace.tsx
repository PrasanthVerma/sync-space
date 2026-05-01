import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EditorWorkspace from '../components/EditorWorkspace';
import TerminalOutput from '../components/TerminalOutput';
import UserSidebar from '../components/UserSidebar';
import FileExplorer from '../components/FileExplorer';
import { useStore } from '../store/useStore';
import { useState,useEffect } from 'react';
import { logout as logoutApi } from '../services/auth';
import { Code2, Settings2, Users, LogOut, LayoutDashboard, Folder, Play } from 'lucide-react';

const Workspace: React.FC = () => {
  const { roomId, fileId } = useParams<{ roomId: string, fileId: string }>();
  const navigate = useNavigate();
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(fileId);
  const [activeTab, setActiveTab] = useState<'files' | 'users'>('files');
  const [showTerminal, setShowTerminal] = useState(true);
  const { language, setLanguage, setToken, setAuthUser } = useStore();

  useEffect(() => {
    if (selectedFileId && selectedFileId !== fileId) {
      navigate(`/api/rooms/${roomId}/files/${selectedFileId}`, { replace: true });
    }
  }, [selectedFileId, roomId, navigate, fileId]);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.error(e);
    } finally {
      setToken(null);
      setAuthUser(null);
      navigate('/login');
    }
  };

  if (!roomId || roomId === 'undefined') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white p-6">
        <h2 className="text-xl font-bold mb-4">Invalid Room ID</h2>
        <p className="text-gray-400 mb-6">The room you are looking for does not exist or the ID is invalid.</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-200 overflow-hidden font-sans">
      {/* Navbar */}
      <header className="flex h-12 items-center justify-between px-4 border-b border-gray-800 bg-gray-900 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 hover:opacity-80 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <Code2 className="text-blue-500" size={20} />
            <h1 className="text-sm font-bold tracking-tight">SyncSpace</h1>
          </div>
          <div className="h-4 w-[1px] bg-gray-800 mx-2" />
          <span className="px-2 py-0.5 text-[10px] font-mono bg-gray-800 rounded text-gray-400 border border-gray-700">
            {roomId}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Language</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-800 text-xs rounded border border-gray-700 px-2 py-1 outline-none focus:border-blue-500 transition-colors font-medium"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
          </div>
          
          <div className="h-4 w-[1px] bg-gray-800 mx-1" />
          
          <div className="flex items-center gap-1">
            <button 
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded transition-all shadow-lg shadow-green-900/20 mr-2"
              title="Run Code"
            >
              <Play size={12} fill="currentColor" />
              Run Code
            </button>
            <button 
              onClick={() => setShowTerminal(!showTerminal)}
              className={`p-1.5 rounded transition-colors ${showTerminal ? 'text-blue-400 bg-blue-400/10' : 'text-gray-400 hover:text-white'}`}
              title="Toggle Terminal"
            >
              <LayoutDashboard size={16} />
            </button>
            <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar (Thin Left) */}
        <div className="w-12 bg-gray-950 border-r border-gray-800 flex flex-col items-center py-4 gap-4 z-10">
          <button 
            onClick={() => setActiveTab('files')}
            className={`p-2 rounded-lg transition-all ${activeTab === 'files' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Folder size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`p-2 rounded-lg transition-all ${activeTab === 'users' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Users size={20} />
          </button>
          <div className="mt-auto">
            <button className="p-2 text-gray-500 hover:text-gray-300 transition-all">
              <Settings2 size={20} />
            </button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="w-64 bg-gray-900/50 border-r border-gray-800 flex flex-col overflow-hidden">
          {activeTab === 'files' ? (
            <FileExplorer 
              roomId={roomId} 
              onFileSelect={(id) => setSelectedFileId(id)} 
              selectedFileId={selectedFileId} 
            />
          ) : (
            <UserSidebar />
          )}
        </div>

        {/* Main Editor & Terminal Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Editor */}
          <div className="flex-1 min-h-0 relative">
            <EditorWorkspace roomId={roomId} fileId={selectedFileId} />
          </div>

          {/* Resizable Terminal (simplified toggle for now) */}
          {showTerminal && (
            <div className="h-[30%] min-h-[150px] border-t border-gray-800 bg-gray-950 relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 cursor-ns-resize hover:bg-blue-500 transition-colors" />
              <TerminalOutput />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Workspace;
