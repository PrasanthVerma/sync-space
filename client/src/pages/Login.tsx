import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { login as loginApi } from '../services/auth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken, setAuthUser } = useStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data = await loginApi({ email, password });
      if (data.success) {
        setToken(data.token);
        setAuthUser(data.data);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full p-8 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl flex flex-col">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Login to SyncSpace</h1>
        {error && <div className="bg-red-500/10 text-red-500 p-3 rounded mb-4 text-sm font-medium border border-red-500/20">{error}</div>}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 text-sm text-gray-200 px-4 py-3 rounded-lg border border-gray-700 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 text-sm text-gray-200 px-4 py-3 rounded-lg border border-gray-700 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 transition-colors text-white font-semibold py-3 px-4 rounded-lg mt-2 shadow-sm shadow-blue-900/20"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account? <Link to="/register" className="text-blue-500 hover:text-blue-400 transition-colors">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
