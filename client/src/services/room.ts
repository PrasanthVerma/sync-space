import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const roomApi = axios.create({
  baseURL: `${API_URL}/api/rooms`,
});

// Request interceptor for API calls
roomApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const createRoom = async (language: string = 'javascript') => {
  const response = await roomApi.post('/create', { language });
  return response.data;
};

export const getUserRooms = async () => {
  const response = await roomApi.get('/user-rooms');
  return response.data;
};

export const getRoomDetails = async (roomId: string) => {
  const response = await roomApi.get(`/${roomId}`);
  return response.data;
};

export const addFileToRoom = async (roomId: string, fileData: { name: string, type: 'file' | 'folder', parentId?: string }) => {
  const response = await roomApi.post(`/${roomId}/files`, fileData);
  return response.data;
};

export const getRoomFiles = async (roomId: string) => {
  const response = await roomApi.get(`/${roomId}/files`);
  return response.data;
};
