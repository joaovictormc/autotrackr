/*
  # Create vehicles table

  1. New Tables
    - `vehicles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `brand` (text, vehicle manufacturer)
      - `model` (text, vehicle model)
      - `plate` (text, unique license plate)
      - `year` (integer, manufacturing year)
      - `mileage` (integer, current mileage)
      - `created_at` (timestamp with timezone)
      - `updated_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `vehicles` table
    - Add policies for authenticated users to:
      - Read their own vehicles
      - Create new vehicles
      - Update their own vehicles
*/

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  plate text UNIQUE NOT NULL,
  year integer NOT NULL,
  mileage integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own vehicles
CREATE POLICY "Users can read own vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own vehicles
CREATE POLICY "Users can create vehicles"
  ON vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own vehicles
CREATE POLICY "Users can update own vehicles"
  ON vehicles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);