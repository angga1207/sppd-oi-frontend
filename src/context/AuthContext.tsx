'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Load user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.data);
        localStorage.setItem('auth_user', JSON.stringify(response.data.data));
      }
    } catch {
      // Token might be invalid
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password });

      if (response.data.success) {
        const { user: userData, token: authToken } = response.data.data;

        setUser(userData);
        setToken(authToken);
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('auth_user', JSON.stringify(userData));

        return { success: true, message: response.data.message };
      }

      return { success: false, message: response.data.message || 'Login gagal' };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        message: err.response?.data?.message || 'Terjadi kesalahan saat login',
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isAuthenticated, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
