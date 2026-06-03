-- Execute este script no editor SQL do Supabase (https://supabase.com/dashboard/project/[seu-id-do-projeto]/sql/new)

-- Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  email text,
  name text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de marcas (gerenciada pelo admin)
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de modelos (gerenciada pelo admin)
CREATE TABLE IF NOT EXISTS public.models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(brand_id, name)
);

-- Habilita RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Usuários podem ler seu próprio perfil" 
  ON public.user_profiles 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" 
  ON public.user_profiles 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Administradores podem ler todos os perfis" 
  ON public.user_profiles 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para brands
CREATE POLICY "Qualquer um pode ler marcas" 
  ON public.brands 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Administradores podem gerenciar marcas" 
  ON public.brands 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para models
CREATE POLICY "Qualquer um pode ler modelos" 
  ON public.models 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Administradores podem gerenciar modelos" 
  ON public.models 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Função para tornar um usuário administrador (execute separadamente após o registro)
-- Exemplo: SELECT make_user_admin('seu-email@exemplo.com');
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email text)
RETURNS void AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Obtém o ID do usuário
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', user_email;
  END IF;
  
  -- Insere ou atualiza o perfil do usuário
  INSERT INTO public.user_profiles (user_id, email, role)
  VALUES (user_id, user_email, 'admin')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'admin', updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dados iniciais (marcas populares)
INSERT INTO public.brands (name) VALUES
  ('Volkswagen'),
  ('Ford'),
  ('Chevrolet'),
  ('Fiat'),
  ('Toyota'),
  ('Honda'),
  ('Hyundai'),
  ('Nissan'),
  ('Renault'),
  ('BMW'),
  ('Mercedes-Benz'),
  ('Audi'),
  ('Mitsubishi'),
  ('Jeep'),
  ('Citroen'),
  ('Peugeot')
ON CONFLICT (name) DO NOTHING;

-- Função auxiliar para inserir modelos
CREATE OR REPLACE FUNCTION insert_models(brand_name text, model_names text[])
RETURNS void AS $$
DECLARE
  brand_id uuid;
  model_name text;
BEGIN
  -- Obter o ID da marca
  SELECT id INTO brand_id FROM public.brands WHERE name = brand_name;
  
  -- Se a marca não existe, sair
  IF brand_id IS NULL THEN
    RAISE NOTICE 'Marca % não encontrada', brand_name;
    RETURN;
  END IF;
  
  -- Inserir modelos
  FOREACH model_name IN ARRAY model_names LOOP
    INSERT INTO public.models (brand_id, name)
    VALUES (brand_id, model_name)
    ON CONFLICT (brand_id, name) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Inserir modelos para marcas populares
SELECT insert_models('Volkswagen', ARRAY[
  'Gol', 'Fox', 'Polo', 'Golf', 'Jetta', 'Amarok', 'Tiguan', 'T-Cross', 'Virtus', 'Nivus'
]);

SELECT insert_models('Ford', ARRAY[
  'Ka', 'Fiesta', 'Focus', 'EcoSport', 'Ranger', 'Mustang', 'Territory', 'Edge'
]);

SELECT insert_models('Chevrolet', ARRAY[
  'Onix', 'Prisma', 'Cruze', 'S10', 'Tracker', 'Spin', 'Equinox', 'Camaro'
]);

SELECT insert_models('Fiat', ARRAY[
  'Uno', 'Mobi', 'Argo', 'Cronos', 'Toro', 'Strada', 'Pulse', 'Fastback'
]);

SELECT insert_models('Toyota', ARRAY[
  'Corolla', 'Yaris', 'Etios', 'Hilux', 'RAV4', 'SW4', 'Camry', 'Prius'
]);

-- Remover a função auxiliar após o uso
DROP FUNCTION insert_models; 