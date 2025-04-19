-- Corrigir políticas de segurança para permitir inserções
DROP POLICY IF EXISTS "Brands can be created by authenticated users" ON brands;
DROP POLICY IF EXISTS "Models can be created by authenticated users" ON models;

-- Recriar as políticas com regras mais permissivas
CREATE POLICY "Any authenticated user can insert data" 
  ON brands FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Any authenticated user can update data" 
  ON brands FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Any authenticated user can insert models" 
  ON models FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Any authenticated user can update models" 
  ON models FOR UPDATE 
  TO authenticated
  USING (true);

-- Inserir dados básicos novamente
DELETE FROM brands;

INSERT INTO brands (name, api_code) VALUES
  ('Volkswagen', '59'),
  ('Ford', '22'),
  ('Chevrolet', '23'),
  ('Fiat', '21'),
  ('Toyota', '56'),
  ('Honda', '25'),
  ('Hyundai', '26'),
  ('Nissan', '43'),
  ('Renault', '48'); 