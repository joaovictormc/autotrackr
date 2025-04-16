import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Provider, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Tipo de usuário estendido para incluir informações de perfil
export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: Provider) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  console.log('AuthContextProvider inicializado');

  // Função para buscar o perfil do usuário
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Buscando perfil do usuário:', userId);
      
      // Tentar buscar o perfil do usuário na tabela de perfis
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        
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
            return {
              id: userId,
              email: user?.email || '',
              role: 'user' as const,
            };
          }
          
          console.log('Perfil criado com sucesso:', createdProfile);
          
          return {
            id: userId,
            email: user?.email || '',
            role: 'user' as const,
          };
        } catch (insertError) {
          console.error('Erro ao inserir perfil:', insertError);
          return {
            id: userId,
            email: user?.email || '',
            role: 'user' as const,
          };
        }
      }
      
      console.log('Perfil encontrado:', data);
      
      return {
        id: userId,
        email: data.email || user?.email || '',
        role: data.role as 'admin' | 'user',
        name: data.name,
      };
    } catch (err) {
      console.error('Erro inesperado ao buscar perfil:', err);
      return {
        id: userId,
        email: user?.email || '',
        role: 'user' as const,
      };
    }
  };

  // Função para atualizar o perfil do usuário no estado
  const refreshProfile = async () => {
    if (!user) return;
    
    const profile = await fetchUserProfile(user.id);
    setUserProfile(profile);
    setIsAdmin(profile?.role === 'admin');
  };

  useEffect(() => {
    console.log('useEffect: Configurando listener de auth');
    
    // Configurar um timeout para evitar carregamento infinito
    timeoutRef.current = window.setTimeout(() => {
      console.log('TIMEOUT: Carregamento demorou muito tempo');
      setLoadingTimeout(true);
    }, 10000); // 10 segundos
    
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Evento de auth:', event, 'Sessão:', !!session);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('Usuário autenticado, buscando perfil');
        try {
          const profile = await fetchUserProfile(session.user.id);
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
      
      setLoading(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    });

    return () => {
      console.log('Limpeza do effect de auth');
      data?.subscription?.unsubscribe();
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
      timeout: loadingTimeout
    });
  }, [user, session, userProfile, loading, loadingTimeout]);

  // Verificar perfil do usuário ao iniciar (caso já esteja logado)
  useEffect(() => {
    const checkSession = async () => {
      console.log('Verificando sessão existente');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Sessão atual:', !!session);
        
        if (session?.user && !userProfile) {
          console.log('Sessão encontrada, buscando perfil para:', session.user.id);
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
          setIsAdmin(profile?.role === 'admin');
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      }
    };
    
    checkSession();
  }, []);

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

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Tentando registro com email:', email);
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      console.log('Registro bem-sucedido');
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
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      console.log('Redirecionando para provedor OAuth');
    } catch (err) {
      console.error('Erro no login com provedor:', err);
      throw err;
    }
  };

  const signOut = async () => {
    console.log('Iniciando processo de logout');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro no logout:', error);
        throw error;
      }
      console.log('Logout bem-sucedido');
    } catch (error) {
      console.error('Exceção no logout:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        userProfile,
        loading, 
        isAdmin,
        signIn, 
        signUp, 
        signInWithProvider, 
        signOut,
        refreshProfile 
      }}
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