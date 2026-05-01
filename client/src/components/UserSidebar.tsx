import React from 'react';
import { useStore } from '../store/useStore';
import { Users, UserCircle2 } from 'lucide-react';

const UserSidebar: React.FC = () => {
  const { users, username, setUsername } = useStore();

  return (
    <div className="w-56 h-full bg-gray-900 border-r border-gray-800 flex flex-col text-sm">
      <div className="p-3 border-b border-gray-800">
        <label className="text-xs text-gray-500 mb-2 flex items-center gap-1 uppercase tracking-wider font-semibold">
          <UserCircle2 size={12} /> My Username
        </label>
        <input 
          type="text" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          maxLength={24}
          className="w-full bg-gray-800/50 text-sm text-gray-200 px-2.5 py-1.5 rounded-md border border-gray-700 outline-none focus:border-blue-500 focus:bg-gray-800 transition-all font-medium placeholder:text-gray-600"
        />
      </div>
      <div className="p-3 border-b border-gray-800 flex items-center gap-2 text-gray-400 font-semibold tracking-wider uppercase text-xs">
        <Users size={14} />
        <span>Participants ({users.length})</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {users.map((user) => (
          <div key={user.clientId} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-gray-800 transition-colors">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: user.color }}
            />
            <span className="text-gray-200 truncate" title={user.name}>
              {user.name}
            </span>
          </div>
        ))}
        {users.length === 0 && (
          <div className="text-gray-500 italic p-2 text-xs">Waiting for connection...</div>
        )}
      </div>
    </div>
  );
};

export default UserSidebar;
