import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EditorWorkspace from '../components/EditorWorkspace';
import TerminalOutput from '../components/TerminalOutput';
import UserSidebar from '../components/UserSidebar';
import { useStore } from '../store/useStore';
import { useState } from 'react';
import { logout as logoutApi } from '../services/auth';
import { Code2, Settings2, Users, LogOut } from 'lucide-react';

const Workspace: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [roomID,setRoomID] = useState(roomId);
  const { language, setLanguage, setToken, setAuthUser } = useStore();

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

  if (!roomId) {
    return <div>Invalid Room</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-200">
      {/* Navbar segment */}
      <header className="flex h-14 items-center justify-between px-6 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-2">
          <Code2 className="text-blue-500" />
          <h1 className="text-lg font-bold tracking-tight">SyncSpace</h1>
          <span className="ml-4 px-2.5 py-1 text-xs font-mono bg-gray-800 rounded text-gray-300 border border-gray-700">
            Room: {roomId}
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 font-medium">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-800 text-sm rounded border border-gray-700 px-3 py-1 outline-none focus:border-blue-500 transition-colors"
            >
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="python">Python 3</option>
            </select>
          </div>
          <div className="flex items-center gap-3 border-l border-gray-700 pl-6">
            <button className="text-gray-400 hover:text-white transition-colors" title="Participants">
              <Users size={18} />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors" title="Settings">
              <Settings2 size={18} />
            </button>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <UserSidebar />
        
        {/* Editor Pane */}
        <div className="flex-1 h-full p-4 relative">
          <EditorWorkspace roomId={roomId} />
        </div>
        
        {/* Output/Terminal Pane */}
        <div className="w-[30%] min-w-[300px] h-full">
          <TerminalOutput />
        </div>
      </main>
    </div>
  );
};

export default Workspace;
