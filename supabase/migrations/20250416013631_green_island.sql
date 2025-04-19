/*
  # Create vehicles table

  1. New Tables
    - `vehicles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `brand_id` (uuid, references brands)
      - `model_id` (uuid, references models)
      - `plate` (text, unique license plate)
      - `year` (integer, manufacturing year)
      - `mileage` (integer, current mileage)
      - `color` (text)
      - `vin` (text)
      - `details` (text)
      - `api_year_code` (text)
      - `is_favorite` (boolean, default false)
      - `created_at` (timestamp with timezone)
      - `updated_at` (timestamp with timezone)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create brands table
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  api_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create models table
CREATE TABLE IF NOT EXISTS models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES brands NOT NULL,
  name text NOT NULL,
  api_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  brand_id uuid REFERENCES brands NOT NULL,
  model_id uuid REFERENCES models NOT NULL,
  plate text UNIQUE NOT NULL,
  year integer NOT NULL,
  mileage integer NOT NULL DEFAULT 0,
  color text,
  vin text,
  details text,
  api_year_code text,
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT ALL ON brands TO authenticated;
GRANT ALL ON models TO authenticated;
GRANT ALL ON vehicles TO authenticated;

-- Policies for brands
CREATE POLICY "Brands are viewable by everyone"
  ON brands FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Brands can be created by authenticated users"
  ON brands FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for models
CREATE POLICY "Models are viewable by everyone"
  ON models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Models can be created by authenticated users"
  ON models FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for vehicles
CREATE POLICY "Users can view own vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_id ON vehicles(brand_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_model_id ON vehicles(model_id);
CREATE INDEX IF NOT EXISTS idx_models_brand_id ON models(brand_id);