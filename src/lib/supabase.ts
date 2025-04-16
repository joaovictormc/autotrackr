import { createClient } from '@supabase/supabase-js';

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

// Cria o cliente Supabase
let supabase;
try {
  console.log('Criando cliente Supabase...');
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('Cliente Supabase criado com sucesso');
  
  // Testar conexão
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Erro ao testar conexão com Supabase:', error);
    } else {
      console.log('Conexão com Supabase estabelecida com sucesso');
    }
  });
} catch (error) {
  console.error('Erro fatal ao criar cliente Supabase:', error);
  throw error;
}

export { supabase };