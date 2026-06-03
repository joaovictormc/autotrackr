import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { authApi, UserProfile } from '../api/auth.api';
import { setAccessToken } from '../api/client';

export type { UserProfile };

type OAuthProvider = 'google' | 'github' | 'facebook';

interface AuthContextType {
  user: UserProfile | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loadingError: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  signInWithProvider: (provider: OAuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  retryConnection: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  const applyAuth = (profile: UserProfile, token: string) => {
    setAccessToken(token);
    if (mounted.current) setUser(profile);
  };

  const clearAuth = () => {
    setAccessToken(null);
    if (mounted.current) { setUser(null); }
  };

  const tryRefreshSession = async () => {
    if (!mounted.current) return;
    try {
      const { api } = await import('../api/client');
      const { data } = await api.post('/auth/refresh');
      if (data?.accessToken) {
        setAccessToken(data.accessToken);
        const profile = await authApi.getMe();
        if (mounted.current) setUser(profile);
      }
    } catch {
      // sem sessão ativa — ok, usuário não logado
    } finally {
      if (mounted.current) {
        setLoading(false);
        setLoadingError(false);
      }
    }
  };

  useEffect(() => {
    tryRefreshSession();

    const handleLogout = () => clearAuth();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await authApi.signIn(email, password);
    applyAuth(result.user, result.accessToken);
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    const result = await authApi.signUp(email, password, fullName, phone);
    applyAuth(result.user, result.accessToken);
  };

  const signInWithProvider = async (_provider: OAuthProvider) => {
    throw new Error('Login com provedor social ainda não disponível nesta versão.');
  };

  const signOut = async () => {
    await authApi.signOut().catch(() => {});
    clearAuth();
  };

  const resetPassword = (email: string) =>
    authApi.forgotPassword(email).then(() => {});

  const updatePassword = (password: string) =>
    authApi.updatePassword(password).then(() => {});

  const refreshProfile = async () => {
    const profile = await authApi.getMe();
    if (mounted.current) setUser(profile);
  };

  const retryConnection = () => {
    if (mounted.current) {
      setLoadingError(false);
      setLoading(true);
    }
    tryRefreshSession();
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile: user,
        loading,
        loadingError,
        isAdmin,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signInWithProvider,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
        retryConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}