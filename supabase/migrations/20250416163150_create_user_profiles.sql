-- Criar tabela de perfis de usuário se não existir
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar consultas
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Configurar trigger para atualizar o timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar policies de acesso RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Permitir que usuários vejam e atualizem seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Administradores podem ver e atualizar todos os perfis
CREATE POLICY "Administradores podem ver todos os perfis"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );

CREATE POLICY "Administradores podem atualizar todos os perfis"
  ON public.user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );
