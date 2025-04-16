-- SCRIPT PARA EXECUTAR NO EDITOR SQL DO SUPABASE
-- Acesse o dashboard do Supabase, vá em "SQL Editor" e execute este script

-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create models table with reference to brands
CREATE TABLE IF NOT EXISTS models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(brand_id, name)
);

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Add policies for reading brands
CREATE POLICY "Anyone can read brands"
  ON brands
  FOR SELECT
  TO authenticated
  USING (true);

-- Add policies for reading models
CREATE POLICY "Anyone can read models"
  ON models
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert popular car brands
INSERT INTO brands (name) VALUES
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

-- Insert models for Volkswagen
DO $$
DECLARE 
    brand_id uuid;
BEGIN
    SELECT id INTO brand_id FROM brands WHERE name = 'Volkswagen';
    
    INSERT INTO models (brand_id, name)
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

-- Insert models for Ford
DO $$
DECLARE 
    brand_id uuid;
BEGIN
    SELECT id INTO brand_id FROM brands WHERE name = 'Ford';
    
    INSERT INTO models (brand_id, name)
    VALUES
      (brand_id, 'Ka'),
      (brand_id, 'Fiesta'),
      (brand_id, 'Focus'),
      (brand_id, 'EcoSport'),
      (brand_id, 'Ranger'),
      (brand_id, 'Mustang'),
      (brand_id, 'Territory'),
      (brand_id, 'Edge'),
      (brand_id, 'Bronco'),
      (brand_id, 'Maverick')
    ON CONFLICT (brand_id, name) DO NOTHING;
END $$;

-- Insert models for Chevrolet
DO $$
DECLARE 
    brand_id uuid;
BEGIN
    SELECT id INTO brand_id FROM brands WHERE name = 'Chevrolet';
    
    INSERT INTO models (brand_id, name)
    VALUES
      (brand_id, 'Onix'),
      (brand_id, 'Prisma'),
      (brand_id, 'Cruze'),
      (brand_id, 'S10'),
      (brand_id, 'Tracker'),
      (brand_id, 'Spin'),
      (brand_id, 'Equinox'),
      (brand_id, 'Trailblazer'),
      (brand_id, 'Bolt'),
      (brand_id, 'Camaro'),
      (brand_id, 'Montana'),
      (brand_id, 'Cobalt')
    ON CONFLICT (brand_id, name) DO NOTHING;
END $$;

-- Insert models for Fiat
DO $$
DECLARE 
    brand_id uuid;
BEGIN
    SELECT id INTO brand_id FROM brands WHERE name = 'Fiat';
    
    INSERT INTO models (brand_id, name)
    VALUES
      (brand_id, 'Uno'),
      (brand_id, 'Mobi'),
      (brand_id, 'Argo'),
      (brand_id, 'Cronos'),
      (brand_id, 'Toro'),
      (brand_id, 'Strada'),
      (brand_id, 'Pulse'),
      (brand_id, 'Fastback'),
      (brand_id, 'Fiorino'),
      (brand_id, 'Doblo'),
      (brand_id, 'Ducato'),
      (brand_id, '500')
    ON CONFLICT (brand_id, name) DO NOTHING;
END $$;

-- Insert models for Toyota
DO $$
DECLARE 
    brand_id uuid;
BEGIN
    SELECT id INTO brand_id FROM brands WHERE name = 'Toyota';
    
    INSERT INTO models (brand_id, name)
    VALUES
      (brand_id, 'Corolla'),
      (brand_id, 'Yaris'),
      (brand_id, 'Etios'),
      (brand_id, 'Hilux'),
      (brand_id, 'RAV4'),
      (brand_id, 'SW4'),
      (brand_id, 'Camry'),
      (brand_id, 'Prius'),
      (brand_id, 'Corolla Cross'),
      (brand_id, 'Land Cruiser')
    ON CONFLICT (brand_id, name) DO NOTHING;
END $$;

-- Insert models for Honda
DO $$
DECLARE 
    brand_id uuid;
BEGIN
    SELECT id INTO brand_id FROM brands WHERE name = 'Honda';
    
    INSERT INTO models (brand_id, name)
    VALUES
      (brand_id, 'Civic'),
      (brand_id, 'Fit'),
      (brand_id, 'City'),
      (brand_id, 'HR-V'),
      (brand_id, 'CR-V'),
      (brand_id, 'WR-V'),
      (brand_id, 'Accord'),
      (brand_id, 'Passport')
    ON CONFLICT (brand_id, name) DO NOTHING;
END $$;

-- Insert models for Hyundai
DO $$
DECLARE 
    brand_id uuid;
BEGIN
    SELECT id INTO brand_id FROM brands WHERE name = 'Hyundai';
    
    INSERT INTO models (brand_id, name)
    VALUES
      (brand_id, 'HB20'),
      (brand_id, 'Creta'),
      (brand_id, 'i30'),
      (brand_id, 'Tucson'),
      (brand_id, 'Santa Fe'),
      (brand_id, 'Kona'),
      (brand_id, 'Veloster'),
      (brand_id, 'Azera'),
      (brand_id, 'Elantra')
    ON CONFLICT (brand_id, name) DO NOTHING;
END $$; 