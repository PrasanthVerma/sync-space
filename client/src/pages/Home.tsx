import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Code2, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import { logout as logoutApi } from '../services/auth';


const Home: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();
  const { token, authUser, setToken, setAuthUser } = useStore();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

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
    try {
      setIsJoining(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ language: 'javascript' })
      });

      // If token is expired/invalid, clear it and redirect to login
      // if (res.status === 401) {
      //   setToken(null);
      //   setAuthUser(null);
      //   navigate('/login');
      //   return;
      // }

      const data = await res.json();
      if (data.success) {
        navigate(`api/rooms/${data.data.roomId}`);
      } else {
        console.error('Failed to create room:', data.error);
      }
    } catch (error) {
      console.error('Error creating room', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      navigate(`/api/rooms/${roomId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full p-8 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-6">
          <Code2 size={32} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">SyncSpace</h1>
        <p className="text-gray-400 mb-8">Welcome back, {authUser?.name || 'User'}!</p>

        <button
          onClick={handleCreateRoom}
          disabled={isJoining}
          className="w-full bg-blue-600 hover:bg-blue-500 transition-colors text-white font-semibold py-3 px-4 rounded-lg
           mb-6 shadow-sm shadow-blue-900/20"
        >
          {isJoining ? 'Creating...' : 'Create New Room'}
        </button>

        <div className="w-full flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-800"></div>
          <span className="text-gray-500 text-sm">OR</span>
          <div className="flex-1 h-px bg-gray-800"></div>
        </div>

        <form onSubmit={handleJoinRoom} className="w-full flex gap-2">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500 transition-colors placeholder:text-gray-500"
          />
          <button
            type="submit"
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors text-white font-semibold py-3 px-6 rounded-lg"
          >
            Join
          </button>
        </form>
        <button onClick={handleLogout} className="mt-8 text-sm text-gray-500 hover:text-red-400 flex items-center gap-2 transition-colors">
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default Home;
