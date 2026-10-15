import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken } from '../services/api';
import { User, UserTheme } from '../types';
import { applyTheme, cacheTheme, readCachedTheme } from '../lib/partyTheme';

interface AuthContextValue {
  user: User | null;
  theme: UserTheme | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setThemeState] = useState<UserTheme | null>(() => readCachedTheme());
  const [isLoading, setIsLoading] = useState(true);

  const setTheme = useCallback((next: UserTheme | null | undefined) => {
    setThemeState(next ?? null);
    cacheTheme(next ?? null);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setTheme(data.theme);
    } catch {
      setUser(null);
      setTheme(null);
    }
  }, [setTheme]);

  useEffect(() => {
    const init = async () => {
      // Retry once after 1s to handle Vercel cold start delays
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const { data } = await api.post('/auth/refresh');
          setAccessToken(data.accessToken);
          await refreshUser();
          setIsLoading(false);
          return;
        } catch {
          if (attempt === 0) await new Promise(r => setTimeout(r, 1000));
        }
      }
      setUser(null);
      setTheme(null);
      setIsLoading(false);
    };
    init();

    const handleLogout = () => {
      setUser(null);
      setTheme(null);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [refreshUser, setTheme]);

  const login = async (username: string, password: string) => {
    const { data } = await api.post('/auth/login', { username, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    setTheme(data.theme);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
      setTheme(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, theme, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
