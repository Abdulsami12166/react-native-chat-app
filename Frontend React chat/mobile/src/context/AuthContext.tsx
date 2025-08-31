import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { BASE_URL } from '../../env';

type User = { _id: string; name: string; email: string };

export type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        try {
          setToken(storedToken);
          // validate token & fetch current user
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.log('Invalid stored token, clearing');
          await AsyncStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    await AsyncStorage.setItem('token', res.data.token);
  };

  const register = async (name: string, email: string, password: string) => {
    await api.post('/auth/register', { name, email, password });
    // after register, immediately log in
    const loginRes = await api.post('/auth/login', { email, password });
    setToken(loginRes.data.token);
    setUser(loginRes.data.user);
    await AsyncStorage.setItem('token', loginRes.data.token);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
