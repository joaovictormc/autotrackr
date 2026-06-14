import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { api, setTokens, clearTokens } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import type { UserProfile } from '@autotrackr/shared';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isPro: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get<UserProfile>('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
      await clearTokens();
    }
  }, []);

  useEffect(() => {
    fetchMe().finally(() => setLoading(false));
  }, [fetchMe]);

  const signIn = async (email: string, password: string) => {
    const { data } = await api.post<{ accessToken: string; refreshToken: string; user: UserProfile }>(
      '/auth/sign-in',
      { email, password }
    );
    await setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    router.replace('/(tabs)');
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    const { data } = await api.post<{ accessToken: string; refreshToken: string; user: UserProfile }>(
      '/auth/sign-up',
      { email, password, name, phone }
    );
    await setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    router.replace('/(tabs)');
  };

  const signOut = async () => {
    try { await api.post('/auth/sign-out'); } catch { /* ignora erro de rede */ }
    await clearTokens();
    queryClient.clear();
    setUser(null);
    router.replace('/(auth)/login');
  };

  const refreshProfile = async () => {
    const { data } = await api.get<UserProfile>('/auth/me');
    setUser(data);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated: !!user,
      isPro: user?.plan === 'PRO' || user?.role === 'ADMIN' || user?.role === 'OPERADOR',
      signIn, signUp, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
