/*
  # Create brands and models tables

  1. New Tables
    - `brands`
      - `id` (uuid, primary key)
      - `name` (text, vehicle brand name)
      - `created_at` (timestamp with timezone)
    
    - `models`
      - `id` (uuid, primary key)
      - `brand_id` (uuid, references brands.id)
      - `name` (text, vehicle model name)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read brands and models
*/

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
INSERT INTO models (brand_id, name)
SELECT id, unnest(ARRAY[
  'Gol',
  'Fox',
  'Polo',
  'Golf',
  'Jetta',
  'Amarok',
  'Tiguan',
  'T-Cross',
  'Virtus',
  'Nivus',
  'Saveiro',
  'Voyage'
]) FROM brands WHERE name = 'Volkswagen'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert models for Ford
INSERT INTO models (brand_id, name)
SELECT id, unnest(ARRAY[
  'Ka',
  'Fiesta',
  'Focus',
  'EcoSport',
  'Ranger',
  'Mustang',
  'Territory',
  'Edge',
  'Bronco',
  'Maverick'
]) FROM brands WHERE name = 'Ford'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert models for Chevrolet
INSERT INTO models (brand_id, name)
SELECT id, unnest(ARRAY[
  'Onix',
  'Prisma',
  'Cruze',
  'S10',
  'Tracker',
  'Spin',
  'Equinox',
  'Trailblazer',
  'Bolt',
  'Camaro',
  'Montana',
  'Cobalt'
]) FROM brands WHERE name = 'Chevrolet'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert models for Fiat
INSERT INTO models (brand_id, name)
SELECT id, unnest(ARRAY[
  'Uno',
  'Mobi',
  'Argo',
  'Cronos',
  'Toro',
  'Strada',
  'Pulse',
  'Fastback',
  'Fiorino',
  'Doblo',
  'Ducato',
  '500'
]) FROM brands WHERE name = 'Fiat'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert models for Toyota
INSERT INTO models (brand_id, name)
SELECT id, unnest(ARRAY[
  'Corolla',
  'Yaris',
  'Etios',
  'Hilux',
  'RAV4',
  'SW4',
  'Camry',
  'Prius',
  'Corolla Cross',
  'Land Cruiser'
]) FROM brands WHERE name = 'Toyota'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert models for Honda
INSERT INTO models (brand_id, name)
SELECT id, unnest(ARRAY[
  'Civic',
  'Fit',
  'City',
  'HR-V',
  'CR-V',
  'WR-V',
  'Accord',
  'Passport'
]) FROM brands WHERE name = 'Honda'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert models for Hyundai
INSERT INTO models (brand_id, name)
SELECT id, unnest(ARRAY[
  'HB20',
  'Creta',
  'i30',
  'Tucson',
  'Santa Fe',
  'Kona',
  'Veloster',
  'Azera',
  'Elantra'
]) FROM brands WHERE name = 'Hyundai'
ON CONFLICT (brand_id, name) DO NOTHING; 