import { create } from "zustand";

export interface User {
  clientId: number;
  name: string;
  color: string;
}

interface EditorState {
  roomId: string | null;
  language: string;
  code: string;
  output: string;
  isExecuting: boolean;
  users: User[];
  username: string;
  token: string | null;
  authUser: any | null;
  setRoomId: (id: string | null) => void;
  setLanguage: (lang: string) => void;
  setCode: (code: string) => void;
  setOutput: (output: string) => void;
  setIsExecuting: (isExecuting: boolean) => void;
  setUsers: (users: User[]) => void;
  setUsername: (username: string) => void;
  setToken: (token: string | null) => void;
  setAuthUser: (user: any | null) => void;
}

export const useStore = create<EditorState>((set) => ({
  roomId: null,
  language: "javascript",
  code: "",
  output: "",
  isExecuting: false,
  users: [],
  username: "",
  token: localStorage.getItem("token") || null,
  authUser: null,
  setRoomId: (id) => set({ roomId: id }),
  setLanguage: (language) => set({ language }),
  setCode: (code) => set({ code }),
  setOutput: (output) => set({ output }),
  setIsExecuting: (isExecuting) => set({ isExecuting }),
  setUsers: (users) => set({ users }),
  setUsername: (username) => set({ username }),
  setToken: (token) => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
    set({ token });
  },
  setAuthUser: (user) =>
    set({ authUser: user, username: user ? user.name : "" }),
}));
