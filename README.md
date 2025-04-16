# AutoTrackr

## Configuração do Banco de Dados

Para configurar o banco de dados corretamente, siga estas instruções:

1. Acesse o painel administrativo do Supabase para o projeto
2. Vá para a seção "SQL Editor" e execute o script SQL abaixo
3. Este script criará todas as tabelas necessárias para a aplicação funcionar corretamente

```sql
-- ===============================
-- TABELAS DE USUÁRIOS E PERFIS
-- ===============================

-- Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- ===============================
-- TABELAS DE MARCAS E MODELOS
-- ===============================

-- Criar tabela de marcas
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de modelos
CREATE TABLE IF NOT EXISTS public.models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

-- ===============================
-- TABELAS DE VEÍCULOS
-- ===============================

-- Criar tabela de veículos
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id),
  model_id UUID NOT NULL REFERENCES public.models(id),
  plate VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER NOT NULL DEFAULT 0,
  color VARCHAR(50),
  vin VARCHAR(50),
  details TEXT,
  is_favorite BOOLEAN DEFAULT false,
  
  -- Campos de dados da API
  api_brand_code VARCHAR(50),
  api_model_code VARCHAR(50),
  api_year_code VARCHAR(50),
  fipe_code VARCHAR(20),
  fipe_value DECIMAL(10, 2),
  fuel_type VARCHAR(50),
  engine_info VARCHAR(100),
  transmission VARCHAR(50),
  body_type VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, plate)
);

-- ===============================
-- TABELAS DE MANUTENÇÕES
-- ===============================

-- Criar tabela de tipos de manutenção
CREATE TABLE IF NOT EXISTS public.maintenance_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de registros de manutenção
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  maintenance_type_id UUID NOT NULL REFERENCES public.maintenance_types(id),
  date DATE NOT NULL,
  mileage INTEGER NOT NULL,
  cost DECIMAL(10, 2),
  notes TEXT,
  location VARCHAR(255),
  reminder_date DATE,
  reminder_mileage INTEGER,
  is_completed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================
-- FUNÇÕES E TRIGGERS
-- ===============================

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para atualização automática de timestamps
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_models_updated_at
BEFORE UPDATE ON public.models
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_types_updated_at
BEFORE UPDATE ON public.maintenance_types
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_records_updated_at
BEFORE UPDATE ON public.maintenance_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================
-- FUNÇÕES PARA INTEGRAÇÃO COM API
-- ===============================

-- Função para garantir que uma marca exista e retornar seu ID
CREATE OR REPLACE FUNCTION get_or_create_brand(brand_name TEXT)
RETURNS UUID AS $$
DECLARE
  brand_id UUID;
BEGIN
  -- Procurar marca existente
  SELECT id INTO brand_id FROM public.brands WHERE name = brand_name;
  
  -- Criar marca se não existir
  IF brand_id IS NULL THEN
    INSERT INTO public.brands (name)
    VALUES (brand_name)
    RETURNING id INTO brand_id;
  END IF;
  
  RETURN brand_id;
END;
$$ LANGUAGE plpgsql;

-- Função para garantir que um modelo exista para uma marca e retornar seu ID
CREATE OR REPLACE FUNCTION get_or_create_model(brand_id UUID, model_name TEXT)
RETURNS UUID AS $$
DECLARE
  model_id UUID;
BEGIN
  -- Procurar modelo existente
  SELECT id INTO model_id FROM public.models 
  WHERE brand_id = $1 AND name = model_name;
  
  -- Criar modelo se não existir
  IF model_id IS NULL THEN
    INSERT INTO public.models (brand_id, name)
    VALUES (brand_id, model_name)
    RETURNING id INTO model_id;
  END IF;
  
  RETURN model_id;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar novo veículo a partir de dados da API
CREATE OR REPLACE FUNCTION register_vehicle_from_api(
  p_user_id UUID,
  p_brand_name TEXT,
  p_model_name TEXT,
  p_year INTEGER,
  p_plate TEXT,
  p_mileage INTEGER,
  p_color TEXT DEFAULT NULL,
  p_vin TEXT DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_api_brand_code TEXT DEFAULT NULL,
  p_api_model_code TEXT DEFAULT NULL,
  p_api_year_code TEXT DEFAULT NULL,
  p_fipe_code TEXT DEFAULT NULL,
  p_fipe_value DECIMAL DEFAULT NULL,
  p_fuel_type TEXT DEFAULT NULL,
  p_engine_info TEXT DEFAULT NULL,
  p_transmission TEXT DEFAULT NULL,
  p_body_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  brand_id UUID;
  model_id UUID;
  vehicle_id UUID;
BEGIN
  -- Obter ou criar marca
  brand_id := get_or_create_brand(p_brand_name);
  
  -- Obter ou criar modelo
  model_id := get_or_create_model(brand_id, p_model_name);
  
  -- Registrar veículo
  INSERT INTO public.vehicles (
    user_id, 
    brand_id, 
    model_id, 
    plate, 
    year, 
    mileage, 
    color, 
    vin, 
    details,
    api_brand_code,
    api_model_code,
    api_year_code,
    fipe_code,
    fipe_value,
    fuel_type,
    engine_info,
    transmission,
    body_type
  )
  VALUES (
    p_user_id,
    brand_id,
    model_id,
    p_plate,
    p_year,
    p_mileage,
    p_color,
    p_vin,
    p_details,
    p_api_brand_code,
    p_api_model_code,
    p_api_year_code,
    p_fipe_code,
    p_fipe_value,
    p_fuel_type,
    p_engine_info,
    p_transmission,
    p_body_type
  )
  RETURNING id INTO vehicle_id;
  
  RETURN vehicle_id;
END;
$$ LANGUAGE plpgsql;

-- ===============================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ===============================

-- Habilitar RLS (Row Level Security) em todas as tabelas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para marcas e modelos (leitura para todos, gestão para admin)
CREATE POLICY "Qualquer usuário pode ler marcas"
  ON public.brands
  FOR SELECT
  USING (true);

CREATE POLICY "Qualquer usuário pode ler modelos"
  ON public.models
  FOR SELECT
  USING (true);

-- Políticas para veículos
CREATE POLICY "Usuários podem ver seus próprios veículos"
  ON public.vehicles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios veículos"
  ON public.vehicles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios veículos"
  ON public.vehicles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios veículos"
  ON public.vehicles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para tipos de manutenção (leitura para todos)
CREATE POLICY "Qualquer usuário pode ler tipos de manutenção"
  ON public.maintenance_types
  FOR SELECT
  USING (true);

-- Políticas para registros de manutenção
CREATE POLICY "Usuários podem ver suas próprias manutenções"
  ON public.maintenance_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = maintenance_records.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir manutenções para seus veículos"
  ON public.maintenance_records
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = maintenance_records.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar suas próprias manutenções"
  ON public.maintenance_records
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = maintenance_records.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem excluir suas próprias manutenções"
  ON public.maintenance_records
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles
      WHERE vehicles.id = maintenance_records.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Políticas para administradores
-- Criar políticas que permitem aos administradores gerenciar todas as tabelas
CREATE POLICY "Administradores podem ver todos os perfis"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );

CREATE POLICY "Administradores podem gerenciar marcas"
  ON public.brands
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );

CREATE POLICY "Administradores podem gerenciar modelos"
  ON public.models
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );

CREATE POLICY "Administradores podem gerenciar tipos de manutenção"
  ON public.maintenance_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );

-- ===============================
-- FUNÇÃO PARA CRIAR ADMINISTRADOR
-- ===============================

-- Função para tornar um usuário administrador
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
  INSERT INTO public.user_profiles (user_id, email, role, name)
  VALUES (user_id, user_email, 'admin', 'Administrador do Sistema')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'admin', updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================
-- DADOS INICIAIS
-- ===============================

-- Inserir tipos de manutenção padrão
INSERT INTO public.maintenance_types (name, description) VALUES
  ('Troca de Óleo', 'Substituição do óleo do motor e filtro de óleo'),
  ('Revisão Geral', 'Verificação completa de todos os sistemas do veículo'),
  ('Troca de Filtros', 'Substituição dos filtros de ar, combustível e/ou pólen'),
  ('Alinhamento e Balanceamento', 'Alinhamento da direção e balanceamento das rodas'),
  ('Troca de Pneus', 'Substituição de um ou mais pneus'),
  ('Freios', 'Manutenção do sistema de freios, pastilhas, discos, etc.'),
  ('Bateria', 'Substituição ou manutenção da bateria'),
  ('Arrefecimento', 'Manutenção do sistema de arrefecimento, radiador, fluido, etc.'),
  ('Suspensão', 'Reparos ou substituição de componentes da suspensão'),
  ('Correia Dentada', 'Substituição da correia de distribuição'),
  ('Embreagem', 'Substituição ou reparos no sistema de embreagem'),
  ('Sistema Elétrico', 'Reparos no sistema elétrico e eletrônico'),
  ('Injeção Eletrônica', 'Limpeza ou reparos no sistema de injeção'),
  ('Ar Condicionado', 'Manutenção, recarga ou reparos no sistema de ar condicionado'),
  ('Direção Hidráulica', 'Manutenção do sistema de direção'),
  ('Velas e Cabos', 'Substituição de velas de ignição e cabos')
ON CONFLICT (name) DO NOTHING;

-- Inserir marcas de veículos populares
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
```

## Criação do Usuário Administrador

Após configurar o banco de dados, você pode criar um usuário administrador de duas maneiras:

### Opção 1: Através da interface da aplicação

1. Registre um novo usuário através da interface de registro da aplicação
2. Após o registro, execute o seguinte comando SQL no SQL Editor do Supabase:

```sql
SELECT make_user_admin('email_do_usuario@exemplo.com');
```

### Opção 2: Diretamente pelo SQL

Execute o seguinte comando SQL para atualizar um usuário existente:

```sql
SELECT make_user_admin('email_do_usuario@exemplo.com');
```

## Populando os Modelos de Veículos

Para adicionar modelos para uma marca específica (exemplo para Volkswagen):

```sql
-- Inserir modelos para Volkswagen
DO $$
DECLARE 
    brand_id uuid;
BEGIN
    SELECT id INTO brand_id FROM public.brands WHERE name = 'Volkswagen';
    
    INSERT INTO public.models (brand_id, name)
    VALUES
      (brand_id, 'Gol'),
      (brand_id, 'Fox'),
      (brand_id, 'Polo'),
      (brand_id, 'Golf'),
      (brand_id, 'Jetta'),
      (brand_id, 'Amarok'),
      (brand_id, 'Tiguan'),
      (brand_id, 'T-Cross'),
      (brand_id, 'Virtus'),
      (brand_id, 'Nivus'),
      (brand_id, 'Saveiro'),
      (brand_id, 'Voyage')
    ON CONFLICT (brand_id, name) DO NOTHING;
END $$;
```

## Integração com API de Veículos

Para integrar com uma API externa de veículos, o banco de dados foi configurado com:

1. **Campos adicionais na tabela `vehicles`** para armazenar dados específicos da API, como códigos de marca/modelo, código FIPE, valor FIPE, etc.

2. **Funções auxiliares** que facilitam o registro de veículos a partir de dados da API:
   - `get_or_create_brand`: Verifica se uma marca existe e a cria caso não exista
   - `get_or_create_model`: Verifica se um modelo existe para uma marca e o cria caso não exista
   - `register_vehicle_from_api`: Registra um veículo completo com todos os dados da API

### Exemplo de Uso da Função de Registro

Para registrar um novo veículo usando dados da API:

```sql
SELECT register_vehicle_from_api(
  'id-do-usuario-aqui', -- UUID do usuário
  'Volkswagen',         -- Nome da marca
  'Golf GTI',           -- Nome do modelo
  2022,                 -- Ano
  'ABC1234',            -- Placa
  15000,                -- Quilometragem
  'Preto',              -- Cor (opcional)
  '12345678901234567',  -- VIN (opcional)
  'Veículo em ótimo estado', -- Detalhes (opcional)
  '23',                 -- Código da marca na API (opcional)
  '5932',               -- Código do modelo na API (opcional)
  '2022-1',             -- Código do ano na API (opcional)
  '001303-0',           -- Código FIPE (opcional)
  125000.00,            -- Valor FIPE (opcional)
  'Gasolina',           -- Tipo de combustível (opcional)
  '2.0 Turbo',          -- Informações do motor (opcional)
  'Automático DSG',     -- Transmissão (opcional)
  'Hatchback'           -- Tipo de carroceria (opcional)
);
```

## Solução de Problemas

Se você encontrar problemas:

1. Verifique as políticas RLS (Row Level Security) para garantir que os usuários tenham as permissões necessárias
2. Certifique-se de que o usuário que está tentando acessar os dados está autenticado
3. Para visualizar quais tabelas estão atualmente no banco de dados, execute:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```