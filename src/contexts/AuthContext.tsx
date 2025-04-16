import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Provider, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Tipo de usuário estendido para incluir informações de perfil
export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loadingError: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  signInWithProvider: (provider: Provider) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  retryConnection: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Salvar perfil no localStorage para servir como cache
const saveProfileToCache = (profile: UserProfile) => {
  try {
    localStorage.setItem('cached_user_profile', JSON.stringify(profile));
  } catch (e) {
    console.warn('Erro ao salvar perfil no cache:', e);
  }
};

// Recuperar perfil do cache
const getCachedProfile = (): UserProfile | null => {
  try {
    const cached = localStorage.getItem('cached_user_profile');
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    console.warn('Erro ao ler perfil do cache:', e);
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const connectionAttemptsRef = useRef(0);
  const maxRetries = 3;

  console.log('AuthContextProvider inicializado');

  // Função para reiniciar a conexão
  const retryConnection = () => {
    console.log('Tentando reconectar...');
    setLoadingError(false);
    setLoading(true);
    setLoadingTimeout(false);
    connectionAttemptsRef.current = 0;
    
    // Tentar novamente a verificação da sessão
    initializeAuth();
  };

  // Função para buscar o perfil do usuário
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Buscando perfil do usuário:', userId);
      
      // Primeiro, tentar usar o cache se disponível
      const cachedProfile = getCachedProfile();
      if (cachedProfile && cachedProfile.id === userId) {
        console.log('Usando perfil em cache temporariamente');
      }
      
      // Tentar buscar o perfil do usuário na tabela de perfis
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        
        // Se tiver cache, usar como fallback
        if (cachedProfile && cachedProfile.id === userId) {
          console.log('Usando perfil em cache como fallback');
          return cachedProfile;
        }
        
        // Verificar se a tabela existe
        const { data: tables, error: tableError } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public')
          .in('tablename', ['user_profiles']);
          
        if (tableError) {
          console.error('Erro ao verificar tabela user_profiles:', tableError);
        } else {
          console.log('Tabela user_profiles existe?', tables && tables.length > 0);
        }
        
        // Se não existir, criar um perfil padrão
        const newProfile = {
          user_id: userId,
          role: 'user',
          email: user?.email || '',
        };
        
        console.log('Criando novo perfil:', newProfile);
        
        try {
          const { data: createdProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert([newProfile])
            .select()
            .single();
            
          if (createError) {
            console.error('Erro ao criar perfil:', createError);
            const defaultProfile = {
              id: userId,
              email: user?.email || '',
              role: 'user' as const,
            };
            saveProfileToCache(defaultProfile);
            return defaultProfile;
          }
          
          console.log('Perfil criado com sucesso:', createdProfile);
          
          const newUserProfile = {
            id: userId,
            email: user?.email || '',
            role: 'user' as const,
          };
          saveProfileToCache(newUserProfile);
          return newUserProfile;
        } catch (insertError) {
          console.error('Erro ao inserir perfil:', insertError);
          const defaultProfile = {
            id: userId,
            email: user?.email || '',
            role: 'user' as const,
          };
          saveProfileToCache(defaultProfile);
          return defaultProfile;
        }
      }
      
      console.log('Perfil encontrado:', data);
      
      const profile = {
        id: userId,
        email: data.email || user?.email || '',
        role: data.role as 'admin' | 'user',
        name: data.name,
        phone: data.phone,
      };
      
      // Atualizar cache
      saveProfileToCache(profile);
      
      return profile;
    } catch (err) {
      console.error('Erro inesperado ao buscar perfil:', err);
      
      // Se tiver cache, usar como fallback
      const cachedProfile = getCachedProfile();
      if (cachedProfile && cachedProfile.id === userId) {
        console.log('Usando perfil em cache após erro');
        return cachedProfile;
      }
      
      const defaultProfile = {
        id: userId,
        email: user?.email || '',
        role: 'user' as const,
      };
      saveProfileToCache(defaultProfile);
      return defaultProfile;
    }
  };

  // Função para atualizar o perfil do usuário no estado
  const refreshProfile = async () => {
    if (!user) return;
    
    const profile = await fetchUserProfile(user.id);
    setUserProfile(profile);
    setIsAdmin(profile?.role === 'admin');
  };

  // Função para inicializar a autenticação
  const initializeAuth = async () => {
    console.log('Inicializando autenticação...');
    
    try {
      // Limpar timeout anterior se existir
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Configurar um novo timeout
      timeoutRef.current = window.setTimeout(() => {
        console.log('TIMEOUT: Carregamento demorou muito tempo');
        setLoadingTimeout(true);
        
        // Se exceder o número máximo de tentativas, mostrar erro
        if (connectionAttemptsRef.current >= maxRetries) {
          setLoadingError(true);
          console.error(`Erro após ${maxRetries} tentativas de conexão`);
        } else {
          // Tentar novamente automaticamente
          connectionAttemptsRef.current++;
          console.log(`Tentativa ${connectionAttemptsRef.current} de ${maxRetries}`);
          initializeAuth();
        }
      }, 7000); // 7 segundos de timeout
      
      // Verificar sessão existente
      const { data: { session } } = await supabase.auth.getSession();
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Tentar usar cache primeiro
        const cachedProfile = getCachedProfile();
        if (cachedProfile && cachedProfile.id === session.user.id) {
          setUserProfile(cachedProfile);
          setIsAdmin(cachedProfile.role === 'admin');
        }
        
        // Buscar perfil atualizado
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile);
        setIsAdmin(profile?.role === 'admin');
      }
      
      // Configurar listener de mudanças de auth
      const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        console.log('Evento de auth:', event, 'Sessão:', !!newSession);
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          console.log('Usuário autenticado, buscando perfil');
          try {
            const profile = await fetchUserProfile(newSession.user.id);
            setUserProfile(profile);
            setIsAdmin(profile?.role === 'admin');
          } catch (error) {
            console.error('Erro ao definir perfil do usuário:', error);
          }
        } else {
          console.log('Sem usuário autenticado, limpando perfil');
          setUserProfile(null);
          setIsAdmin(false);
        }
      });
      
      // Limpar estado de carregamento
      setLoading(false);
      setLoadingTimeout(false);
      setLoadingError(false);
      
      // Limpar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      return () => {
        data?.subscription?.unsubscribe();
      };
    } catch (error) {
      console.error('Erro na inicialização da autenticação:', error);
      
      // Se exceder o número máximo de tentativas, mostrar erro
      if (connectionAttemptsRef.current >= maxRetries) {
        setLoadingError(true);
        setLoading(false);
      } else {
        // Tentar novamente
        connectionAttemptsRef.current++;
        console.log(`Tentativa ${connectionAttemptsRef.current} de ${maxRetries}`);
        setTimeout(initializeAuth, 2000); // Esperar 2 segundos antes de tentar novamente
      }
      
      // Limpar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  // Inicializar autenticação ao montar o componente
  useEffect(() => {
    initializeAuth();
    
    return () => {
      console.log('Limpeza do provider de auth');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    console.log('Estado atual de autenticação:', {
      usuário: !!user,
      sessão: !!session,
      perfil: !!userProfile,
      carregando: loading,
      timeout: loadingTimeout,
      erro: loadingError,
      tentativas: connectionAttemptsRef.current
    });
  }, [user, session, userProfile, loading, loadingTimeout, loadingError]);
  
  const signIn = async (email: string, password: string) => {
    console.log('Tentando fazer login com email:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error);
        throw error;
      }
      
      console.log('Login bem-sucedido:', data);
      return data;
    } catch (error) {
      console.error('Exceção no login:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      console.log('Tentando registro com email:', email);
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      
      if (data?.user) {
        console.log('Registro bem-sucedido, salvando dados de perfil');
        try {
          const newProfile = {
            user_id: data.user.id,
            email: email,
            name: fullName,
            phone: phone,
            role: 'user'
          };
          
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([newProfile]);
            
          if (profileError) {
            console.error('Erro ao salvar perfil:', profileError);
          } else {
            console.log('Perfil do usuário salvo com sucesso');
            // Atualizar perfil no contexto
            const profile = {
              id: data.user.id,
              email: email,
              role: 'user' as const,
              name: fullName,
              phone: phone
            };
            setUserProfile(profile);
            saveProfileToCache(profile);
          }
        } catch (profileSaveErr) {
          console.error('Exceção ao salvar perfil:', profileSaveErr);
        }
      }
    } catch (err) {
      console.error('Erro no registro:', err);
      throw err;
    }
  };

  const signInWithProvider = async (provider: Provider) => {
    try {
      console.log('Tentando login com provedor:', provider);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
      });
      if (error) throw error;
      console.log('Login com provedor iniciado');
    } catch (err) {
      console.error('Erro no login com provedor:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      console.log('Fazendo logout');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('Logout bem-sucedido');
    } catch (err) {
      console.error('Erro no logout:', err);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('Enviando email de recuperação de senha para:', email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      console.log('Email de recuperação enviado com sucesso');
    } catch (err) {
      console.error('Erro ao enviar email de recuperação:', err);
      throw err;
    }
  };

  const updatePassword = async (password: string) => {
    try {
      console.log('Atualizando senha do usuário');
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      console.log('Senha atualizada com sucesso');
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        loadingError,
        isAdmin,
        signIn,
        signUp,
        signInWithProvider,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
        retryConnection
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