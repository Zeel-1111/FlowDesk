import { createContext, useContext, useState, type ReactNode } from 'react';
import api from '../api/axios';
import { type LoginDto, type RegisterDto } from '../types';

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<{ email: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (data: LoginDto) => {
    const response = await api.post('/Auth/login', data);
    const { token, name, email } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ name, email }));
    setUser({ name, email });
  };

  const register = async (data: RegisterDto) => {
    const response = await api.post('/Auth/register', data);
    return { email: response.data.email };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}