import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  Plus,
  FolderPlus,
  FilePlus,
  LogOut,
  Search,
  Folder,
  FileText,
  Download,
  ChevronRight,
  Hash,
  Users as UsersIcon,
  LayoutDashboard
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { logout as logoutApi } from '../services/auth';
import {
  getUserRooms,
  createRoom,
  getRoomDetails,
  addFileToRoom,
  getRoomFiles
} from '../services/room';

interface FileItem {
  _id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  path: string;
  meta: {
    language: string;
    size: number;
  };
}

interface Room {
  _id: string;
  name: string;
  ownerId: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  isPublic: boolean;
  rootFolderId: string;
  participants: {
    userId: string;
    username: string;
    email: string;
    avatar?: string;
    role: string;
  }[];
  files: FileItem[];
  userRole: string;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { authUser, setToken, setAuthUser } = useStore();

  // State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [modalType, setModalType] = useState<'file' | 'folder'>('file');

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const data = await getUserRooms();
      if (data.success) {
        setRooms(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleCreateRoom = async () => {
    setIsCreatingRoom(true);
    try {
      const roomName = `Project-${Math.floor(Math.random() * 1000)}`;
      const data = await createRoom(roomName);
      if (data.success) {
        await fetchRooms();
        // Automatically select the new room
        const newRoom = data.data;
        handleSelectRoom(newRoom._id);
      }
    } catch (err) {
      console.error('Failed to create room:', err);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinRoomId.trim()) {
      navigate(`/api/rooms/${joinRoomId.trim()}`);
    }
  };

  const handleSelectRoom = async (roomId: string) => {
    try {
      const data = await getRoomDetails(roomId);
      if (data.success) {
        setSelectedRoom(data.data);
        // Fetch files for the root folder
        const filesData = await getRoomFiles(data.data._id);
        if (filesData.success) {
          data.data.files = filesData.data;
          setSelectedRoom({ ...data.data });
        }
      }
    } catch (err) {
      console.error('Failed to fetch room details:', err);
    }
  };

  const handleCreateFile = async () => {
    if (!selectedRoom || !newFileName.trim()) return;

    try {
      const data = await addFileToRoom(selectedRoom._id, {
        name: newFileName.trim(),
        type: modalType
      });
      console.log('Dashboard: Create file response:', data);

      if (data.success) {
        console.log('Dashboard: Refreshing room details for:', selectedRoom._id);
        // Refresh selected room to show new file
        handleSelectRoom(selectedRoom._id);
        setNewFileName('');
        setShowNewFileModal(false);
      } else {
        console.warn('Dashboard: Create file failed:', data.error);
      }
    } catch (err) {
      console.error('Failed to create file/folder:', err);
    }
  };

  const handleExportFile = (file: FileItem) => {
    const extension = file.meta?.language === 'python' ? '.py' :
      file.meta?.language === 'javascript' ? '.js' : '.txt';
    const fileName = file.name.includes('.') ? file.name : `${file.name}${extension}`;

    // Note: In the new system, content needs to be fetched from FileContent.
    // For now, we'll use a placeholder or handle it if content was somehow populated.
    const content = (file as any).content || '// File content only available in Workspace';

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenWorkspace = (roomId: string) => {
    if (!roomId || roomId === 'undefined') {
      console.error('Dashboard: Cannot open workspace, roomId is missing');
      return;
    }
    navigate(`/api/rooms/${roomId}`);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-200 overflow-hidden font-sans">
      {/* Navbar */}
      <nav className="flex h-16 items-center justify-between px-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/20">
            <Code2 size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            SyncSpace
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 rounded-full border border-gray-700">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {authUser?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none">{authUser?.username || 'User'}</span>
              <span className="text-xs text-gray-500 leading-none mt-1">{authUser?.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-200"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-72 border-r border-gray-800 bg-gray-900/30 flex flex-col">
          <div className="p-4 space-y-4">
            <button
              onClick={handleCreateRoom}
              disabled={isCreatingRoom}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-900/20"
            >
              <Plus size={20} />
              {isCreatingRoom ? 'Creating...' : 'New Room'}
            </button>

            <form onSubmit={handleJoinRoom} className="relative group">
              <input
                type="text"
                placeholder="Join by Room ID..."
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="w-full bg-gray-800/50 text-sm text-gray-200 pl-10 pr-4 py-3 rounded-xl border border-gray-700 outline-none focus:border-blue-500 transition-all group-hover:bg-gray-800"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <button type="submit" className="hidden"></button>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-thin scrollbar-thumb-gray-800">
            <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <LayoutDashboard size={14} />
              Your Rooms
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-2 px-2 mt-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-gray-800/30 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-10 px-4">
                <p className="text-sm text-gray-500">No rooms yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="space-y-1 mt-2">
                {rooms.map((room) => (
                  <button
                    key={room._id}
                    onClick={() => handleSelectRoom(room._id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${selectedRoom?._id === room._id
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                        : 'hover:bg-gray-800/50 text-gray-400'
                      }`}
                  >
                    <div className={`p-2 rounded-lg ${selectedRoom?._id === room._id ? 'bg-blue-600/20' : 'bg-gray-800 group-hover:bg-gray-700'
                      }`}>
                      <Hash size={16} />
                    </div>
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="text-sm font-semibold truncate w-full">{room.name}</span>
                      <span className="text-[10px] opacity-60 uppercase">{room.isPublic ? 'Public' : 'Private'}</span>
                    </div>
                    <ChevronRight size={14} className={`ml-auto transition-transform ${selectedRoom?._id === room._id ? 'rotate-90' : ''}`} />
                  </button>
                ))}
              </div>
            )}
          </div>


        </aside>

        {/* Center Section */}
        <main className="flex-1 flex flex-col bg-gray-950/50 relative overflow-hidden">
          {selectedRoom ? (
            <>
              {/* Room Header */}
              <div className="p-6 border-b border-gray-800 bg-gray-900/20 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-bold text-white">Room: {selectedRoom.name}</h2>
                    <span className="px-2.5 py-0.5 text-xs font-mono bg-blue-600/10 text-blue-400 rounded-full border border-blue-600/20">
                      {selectedRoom.userRole}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Created {new Date(selectedRoom.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleOpenWorkspace(selectedRoom._id)}
                    className="flex items-center gap-2 bg-white text-gray-950 hover:bg-gray-200 font-bold px-6 py-2.5 rounded-xl transition-all"
                  >
                    Open Workspace
                  </button>
                </div>
              </div>

              {/* Content Split */}
              <div className="flex-1 flex overflow-hidden">
                {/* Files Section */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
                      <Folder size={20} className="text-blue-500" />
                      Files & Folders
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setModalType('file'); setShowNewFileModal(true); }}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-all"
                      >
                        <FilePlus size={14} />
                        New File
                      </button>
                      <button
                        onClick={() => { setModalType('folder'); setShowNewFileModal(true); }}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-all"
                      >
                        <FolderPlus size={14} />
                        New Folder
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedRoom.files && selectedRoom.files.length > 0 ? (
                      selectedRoom.files.map((file, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-gray-900/40 border border-gray-800 rounded-2xl hover:border-blue-500/50 transition-all group"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl ${file.type === 'folder' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'}`}>
                              {file.type === 'folder' ? <Folder size={24} /> : <FileText size={24} />}
                            </div>
                            {file.type === 'file' && (
                              <button
                                onClick={() => handleExportFile(file)}
                                className="p-2 text-gray-500 hover:text-white bg-gray-800/0 hover:bg-gray-800 rounded-lg transition-all"
                                title="Export"
                              >
                                <Download size={16} />
                              </button>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-200 truncate mb-1">{file.name}</h4>
                          <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{file.type}</p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full flex flex-col items-center justify-center py-20 bg-gray-900/20 border-2 border-dashed border-gray-800 rounded-3xl">
                        <Folder size={48} className="text-gray-700 mb-4" />
                        <p className="text-gray-500">No files in this room yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collaborators Sidebar */}
                <div className="w-80 border-l border-gray-800 p-6 bg-gray-900/10">
                  <h3 className="text-lg font-semibold text-gray-300 mb-6 flex items-center gap-2">
                    <UsersIcon size={20} className="text-blue-500" />
                    Collaborators
                  </h3>
                  <div className="space-y-4">
                    {selectedRoom.participants && selectedRoom.participants.length > 0 ? (
                      selectedRoom.participants.map((p, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl border border-gray-700/50">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {p.username?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{p.username}</span>
                            <span className="text-[10px] text-green-500 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                              Active Now
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 px-4 border border-dashed border-gray-800 rounded-2xl">
                        <p className="text-xs text-gray-500">Only you are here currently</p>
                      </div>
                    )}

                    {/* Placeholder for persistent collaborators if any */}
                    <div className="pt-4 mt-4 border-t border-gray-800">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Owner</p>
                      <div className="flex items-center gap-3 p-3 bg-blue-600/5 rounded-xl border border-blue-600/10">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                          {selectedRoom.ownerId?.username?.charAt(0).toUpperCase() || 'O'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{selectedRoom.ownerId?.username || 'Room Owner'}</span>
                          <span className="text-[10px] text-blue-400">Creator</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-24 h-24 bg-gray-900 border border-gray-800 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                <Code2 size={48} className="text-blue-500 opacity-20" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Welcome to your Dashboard</h2>
              <p className="text-gray-500 max-w-md">
                Select a room from the sidebar to manage files, view collaborators, and start coding together.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-12 w-full max-w-lg">
                <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-2xl text-left hover:border-blue-500/30 transition-all cursor-pointer group" onClick={handleCreateRoom}>
                  <Plus className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-white mb-1">Create Room</h4>
                  <p className="text-xs text-gray-500">Start a new project with your team</p>
                </div>
                <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-2xl text-left hover:border-blue-500/30 transition-all cursor-pointer group" onClick={() => document.querySelector('input')?.focus()}>
                  <Search className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-white mb-1">Join Room</h4>
                  <p className="text-xs text-gray-500">Collaborate on an existing project</p>
                </div>
              </div>
            </div>
          )}

          {/* Modal for New File/Folder */}
          {showNewFileModal && (
            <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-800">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {modalType === 'file' ? <FilePlus className="text-blue-500" /> : <FolderPlus className="text-blue-500" />}
                    New {modalType === 'file' ? 'File' : 'Folder'}
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Name</label>
                    <input
                      autoFocus
                      type="text"
                      placeholder={`Enter ${modalType} name...`}
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                      className="w-full bg-gray-800 text-gray-200 px-4 py-3 rounded-xl border border-gray-700 outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowNewFileModal(false)}
                      className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateFile}
                      disabled={!newFileName.trim()}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
