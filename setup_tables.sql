-- Este script pode ser executado diretamente no console do Supabase
-- se as tabelas não puderem ser criadas automaticamente pela aplicação

-- Criar a tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar a tabela de marcas
CREATE TABLE IF NOT EXISTS public.brands (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar a tabela de modelos
CREATE TABLE IF NOT EXISTS public.models (
  id SERIAL PRIMARY KEY,
  brand_id INTEGER NOT NULL REFERENCES brands(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

-- Criar a tabela de veículos
CREATE TABLE IF NOT EXISTS public.vehicles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  plate TEXT NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plate)
);

-- Inserir marcas padrão
INSERT INTO public.brands (name) VALUES
  ('Volkswagen'),
  ('Ford'),
  ('Chevrolet'),
  ('Fiat'),
  ('Toyota'),
  ('Honda'),
  ('Hyundai'),
  ('Nissan'),
  ('Renault')
ON CONFLICT (name) DO NOTHING;

-- Função para inserir modelos genéricos para cada marca
DO $$
DECLARE
  brand_record RECORD;
BEGIN
  FOR brand_record IN SELECT id FROM brands LOOP
    -- Inserir modelos genéricos para cada marca
    INSERT INTO public.models (brand_id, name) VALUES
      (brand_record.id, 'Sedan'),
      (brand_record.id, 'Hatch'),
      (brand_record.id, 'SUV'),
      (brand_record.id, 'Picape'),
      (brand_record.id, 'Minivan')
    ON CONFLICT (brand_id, name) DO NOTHING;
  END LOOP;
END $$; 