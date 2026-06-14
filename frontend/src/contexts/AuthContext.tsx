import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { authApi, UserProfile } from '../api/auth.api';
import { setAccessToken } from '../api/client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export type { UserProfile };

type OAuthProvider = 'google' | 'github' | 'facebook';

interface AuthContextType {
  user: UserProfile | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isOperator: boolean;
  isStaff: boolean;
  isPro: boolean;
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
  const mounted = useRef(false);

  const applyAuth = (profile: UserProfile, token: string) => {
    setAccessToken(token);
    if (mounted.current) setUser(profile);
  };

  const clearAuth = () => {
    setAccessToken(null);
    if (mounted.current) setUser(null);
  };

  const tryRefreshSession = async () => {
    try {
      const { data } = await axios.post(
        `${API_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      if (data?.accessToken && mounted.current) {
        setAccessToken(data.accessToken);
        const profile = await authApi.getMe();
        if (mounted.current) setUser(profile);
      }
    } catch {
      // 401 = sem sessão ativa — estado correto para usuário não logado
    } finally {
      // Sempre desliga o loading, mesmo sem sessão
      if (mounted.current) {
        setLoading(false);
        setLoadingError(false);
      }
    }
  };

  useEffect(() => {
    // Reset explícito para lidar corretamente com o StrictMode do React,
    // que desmonta e remonta componentes — sem isso mounted.current ficaria
    // false após o primeiro ciclo e setLoading(false) nunca seria chamado.
    mounted.current = true;

    tryRefreshSession();

    const handleLogout = () => clearAuth();
    window.addEventListener('auth:logout', handleLogout);
    return () => {
      mounted.current = false;
      window.removeEventListener('auth:logout', handleLogout);
    };
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
  const isOperator = user?.role === 'OPERADOR';
  const isStaff = isAdmin || isOperator;
  const isPro = user?.plan === 'PRO' || isAdmin || isOperator;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile: user,
        loading,
        loadingError,
        isAdmin,
        isOperator,
        isStaff,
        isPro,
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