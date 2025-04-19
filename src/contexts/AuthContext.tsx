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

// Flag para detectar problemas críticos de inicialização
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 3;

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
  const mounted = useRef(true);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      mounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const safeSetState = (setter: Function, value: any) => {
    if (mounted.current) {
      setter(value);
    }
  };

  // Função para reiniciar a conexão
  const retryConnection = () => {
    if (!mounted.current) return;
    
    console.log('Tentando reconectar...');
    safeSetState(setLoadingError, false);
    safeSetState(setLoading, true);
    safeSetState(setLoadingTimeout, false);
    connectionAttemptsRef.current = 0;
    
    // Tentar novamente a verificação da sessão
    initializeAuth();
  };

  // Função para buscar o perfil do usuário
  const fetchUserProfile = async (userId: string) => {
    if (!mounted.current) return null;

    try {
      console.log('Buscando perfil do usuário:', userId);
      
      // Primeiro, tentar usar o cache se disponível
      const cachedProfile = getCachedProfile();
      if (cachedProfile && cachedProfile.id === userId) {
        console.log('Usando perfil em cache temporariamente');
        return cachedProfile;
      }
      
      if (!mounted.current) return null;

      // Tentar buscar o perfil do usuário na tabela de perfis
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!mounted.current) return null;

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        
        // Se o erro for que o perfil não existe, criar um novo
        if (error.code === 'PGRST116') {
          console.log('Perfil não encontrado, criando novo perfil...');
          const newProfile = {
            user_id: userId,
            email: user?.email || '',
            role: 'user' as const
          };
          
          const { data: insertedProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert(newProfile)
            .select()
            .single();
            
          if (insertError) {
            console.error('Erro ao criar perfil:', insertError);
            throw insertError;
          }
          
          const profile = {
            id: userId,
            email: insertedProfile.email,
            role: insertedProfile.role as 'admin' | 'user',
            name: insertedProfile.name,
            phone: insertedProfile.phone
          };
          
          saveProfileToCache(profile);
          return profile;
        }
        
        // Se tiver cache, usar como fallback
        if (cachedProfile && cachedProfile.id === userId) {
          console.log('Usando perfil em cache como fallback após erro');
          return cachedProfile;
        }

        throw error;
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
      
      // Se não tiver cache, criar um perfil padrão
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
    if (!user || !mounted.current) return;
    
    const profile = await fetchUserProfile(user.id);
    if (profile && mounted.current) {
      safeSetState(setUserProfile, profile);
      safeSetState(setIsAdmin, profile.role === 'admin');
    }
  };

  // Função para inicializar a autenticação
  const initializeAuth = async () => {
    if (!mounted.current) return;
    
    console.log('Inicializando autenticação...');
    
    try {
      // Limpar timeout anterior se existir
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Configurar um novo timeout
      timeoutRef.current = window.setTimeout(() => {
        if (!mounted.current) return;
        
        console.log('TIMEOUT: Carregamento demorou muito tempo');
        safeSetState(setLoadingTimeout, true);
        safeSetState(setLoadingError, true);
        safeSetState(setLoading, false);
        
        // Não tentar reiniciar aqui - deixe o usuário decidir
        console.error('Timeout atingido na autenticação');
      }, 10000); // Agora apenas 10 segundos
      
      if (!mounted.current) return;

      // Verificar sessão existente
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro ao obter sessão:', sessionError);
        throw sessionError;
      }
      
      // Define o estado básico
      safeSetState(setSession, session);
      safeSetState(setUser, session?.user ?? null);

      // Se tiver usuário, simplificar a busca de perfil
      if (session?.user) {
        try {
          // Sempre usar perfil básico primeiro
          const basicProfile = {
            id: session.user.id,
            email: session.user.email || '',
            role: 'user' as const
          };
          
          // Definir o perfil básico enquanto busca o perfil completo
          safeSetState(setUserProfile, basicProfile);
          safeSetState(setIsAdmin, false);
          
          // Limpar timeout já que temos o básico funcionando
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          // Buscar perfil completo em background
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();
            
          if (profileError) {
            console.error('Erro ao buscar perfil:', profileError);
            // Já temos o perfil básico, então continuar mesmo com erro
          } 
          else if (profile) {
            // Perfil existente encontrado
            const userProfile = {
              id: session.user.id,
              email: profile.email,
              role: profile.role as 'admin' | 'user',
              name: profile.name,
              phone: profile.phone
            };
            
            safeSetState(setUserProfile, userProfile);
            safeSetState(setIsAdmin, userProfile.role === 'admin');
            saveProfileToCache(userProfile);
          }
          else {
            // Criar perfil apenas se realmente não existir
            console.log('Criando perfil para:', session.user.email);
            
            try {
              const { error: insertError } = await supabase
                .from('user_profiles')
                .insert({
                  user_id: session.user.id,
                  email: session.user.email || '',
                  role: 'user'
                });
                
              if (insertError) {
                console.error('Erro ao criar perfil:', insertError);
              }
            } catch (err) {
              console.error('Erro ao inserir perfil:', err);
            }
          }
        } catch (error) {
          console.error('Erro ao processar perfil:', error);
          // Continuar mesmo com erro no perfil
        }
      }
      
      // Finalizar inicialização
      safeSetState(setLoading, false);
      safeSetState(setLoadingTimeout, false);
      safeSetState(setLoadingError, false);
      
      // Limpar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } catch (error) {
      console.error('Erro ao inicializar autenticação:', error);
      
      // Falha na inicialização
      safeSetState(setLoadingError, true);
      safeSetState(setLoading, false);
      
      // Limpar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  // Inicializar autenticação ao montar o componente
  useEffect(() => {
    initializeAuth();
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

  // Ajustar a lógica de tentativas de inicialização
  useEffect(() => {
    if (loading) {
      try {
        // Verificar contagem de tentativas de inicialização
        const storedAttempts = localStorage.getItem('auth_init_attempts');
        if (storedAttempts) {
          initializationAttempts = parseInt(storedAttempts, 10);
        }
        
        // Incrementar contagem só se ela for menor que o limite
        if (initializationAttempts < MAX_INITIALIZATION_ATTEMPTS) {
          initializationAttempts++;
          localStorage.setItem('auth_init_attempts', initializationAttempts.toString());
          
          console.log(`Tentativa de inicialização #${initializationAttempts}`);
          
          // Se exceder o limite, redirecionar para a página de erro
          if (initializationAttempts >= MAX_INITIALIZATION_ATTEMPTS) {
            console.error(`ERRO CRÍTICO: ${initializationAttempts} tentativas de inicialização sem sucesso`);
            
            // Redirecionar para página de erro do sistema depois de algumas tentativas
            if (initializationAttempts === MAX_INITIALIZATION_ATTEMPTS) {
              console.log('Redirecionando para página de erro do sistema...');
              setTimeout(() => {
                window.location.href = '/system-error';
              }, 1000);
            }
          }
        }
      } catch (e) {
        console.error('Erro ao verificar tentativas de inicialização:', e);
      }
    } else if (!loading && !loadingError) {
      // Reiniciar contagem se a inicialização foi bem-sucedida
      localStorage.removeItem('auth_init_attempts');
      initializationAttempts = 0;
    }
  }, [loading, loadingError]);

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