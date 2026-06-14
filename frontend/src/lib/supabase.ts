import { createClient, SupabaseClient } from '@supabase/supabase-js';

console.log('Iniciando configuração do Supabase...');

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('URL do Supabase:', supabaseUrl);
console.log('Chave do Supabase configurada?', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não encontradas!');
  console.error('Verifique se o arquivo .env ou .env.local contém VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  throw new Error('Missing Supabase environment variables');
}

// Função para fazer fetch com retry
const fetchWithRetry = async (url: string | Request, options?: RequestInit) => {
  const timeout = 15000; // 15 segundos de timeout
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }
      
      // Se o erro for 500, tentar novamente
      if (response.status === 500) {
        attempt++;
        if (attempt < maxRetries) {
          console.log(`Tentativa ${attempt} de ${maxRetries} para ${url.toString()}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Espera exponencial
          continue;
        }
      }
      
      return response; // Retorna a resposta mesmo com erro se não for 500 ou acabaram as tentativas
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`Timeout de ${timeout}ms excedido para ${url.toString()}`);
      }
      
      attempt++;
      if (attempt < maxRetries) {
        console.log(`Tentativa ${attempt} de ${maxRetries} para ${url.toString()}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Espera exponencial
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error(`Máximo de ${maxRetries} tentativas excedido para ${url.toString()}`);
};

// Cria o cliente Supabase com timeout e retentativa configurados
let supabase: SupabaseClient;
try {
  console.log('Criando cliente Supabase...');
  
  const options = {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: { 'x-application-name': 'autotrackr' },
      fetch: fetchWithRetry as typeof fetch
    }
  };
  
  supabase = createClient(supabaseUrl, supabaseAnonKey, options);
  console.log('Cliente Supabase criado com sucesso');
  
  // Testar conexão
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Erro ao testar conexão com Supabase:', error);
    } else {
      console.log('Conexão com Supabase estabelecida com sucesso');
      // Inicializar tabelas se necessário
      initTables();
    }
  }).catch(error => {
    console.error('Exceção ao testar conexão com Supabase:', error);
  });
} catch (error) {
  console.error('Erro fatal ao criar cliente Supabase:', error);
  throw error;
}

// Função para inicializar as tabelas necessárias
async function initTables() {
  try {
    console.log('Tentando inicializar tabelas básicas...');
    
    // Abordagem alternativa sem depender de pg_tables
    // Vamos tentar criar as tabelas diretamente ou consultar os dados
    
    // 1. Tente consultar a tabela de usuários para ver se ela existe
    try {
      const { error: userProfilesError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      if (userProfilesError && userProfilesError.code === '42P01') {
        console.log('Tabela user_profiles não existe');
        // A tabela será criada sob demanda quando necessário
      } else {
        console.log('Tabela user_profiles existe');
      }
    } catch (err) {
      console.error('Erro ao verificar tabela user_profiles:', err);
    }
    
    // 2. Tente consultar a tabela de marcas
    try {
      console.log('Verificando tabela de marcas...');
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('id, name')
        .limit(10);
      
      if (brandsError && brandsError.code === '42P01') {
        console.log('Tabela brands não existe, marcas serão carregadas do fallback');
      } else if (brandsData && brandsData.length === 0) {
        console.log('Tabela brands existe mas está vazia, tentando inserir dados iniciais');
        
        // Tabela existe mas está vazia, inserir dados padrão
        const { error: insertError } = await supabase
          .from('brands')
          .insert([
            { name: 'Volkswagen' },
            { name: 'Ford' },
            { name: 'Chevrolet' },
            { name: 'Fiat' },
            { name: 'Toyota' },
            { name: 'Honda' },
            { name: 'Hyundai' },
            { name: 'Nissan' },
            { name: 'Renault' }
          ]);
          
        if (insertError) {
          console.error('Erro ao inserir marcas padrão:', insertError);
        } else {
          console.log('Marcas padrão inseridas com sucesso');
        }
      } else {
        console.log(`Tabela brands existe com ${brandsData?.length || 0} registros`);
      }
    } catch (err) {
      console.error('Erro ao verificar tabela brands:', err);
    }
    
    // 3. Tente consultar a tabela de modelos
    try {
      console.log('Verificando tabela de modelos...');
      const { data: modelsData, error: modelsError } = await supabase
        .from('models')
        .select('id, brand_id, name')
        .limit(10);
      
      if (modelsError && modelsError.code === '42P01') {
        console.log('Tabela models não existe, modelos serão carregados do fallback');
      } else {
        console.log(`Tabela models existe com ${modelsData?.length || 0} registros`);
      }
    } catch (err) {
      console.error('Erro ao verificar tabela models:', err);
    }
    
    // 4. Tente consultar a tabela de veículos
    try {
      console.log('Verificando tabela de veículos...');
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id')
        .limit(1);
      
      if (vehiclesError && vehiclesError.code === '42P01') {
        console.log('Tabela vehicles não existe, será necessário executar o script SQL');
      } else {
        console.log('Tabela vehicles existe');
      }
    } catch (err) {
      console.error('Erro ao verificar tabela vehicles:', err);
    }
    
    console.log('Verificação de tabelas concluída com abordagem alternativa.');
    console.log('Se as tabelas não existirem, execute o script setup_tables.sql no console do Supabase.');
  } catch (err) {
    console.error('Erro geral ao inicializar tabelas:', err);
  }
}

export { supabase };