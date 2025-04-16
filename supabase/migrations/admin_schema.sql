/*
  # Create admin tables for the application

  1. Tables
    - `user_profiles` (stores user roles and profile info)
    - `brands` (car manufacturers)
    - `models` (car models linked to brands)
  
  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for user and admin access
*/

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  email text,
  name text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Brands table (managed by admin)
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Models table (managed by admin)
CREATE TABLE IF NOT EXISTS models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(brand_id, name)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can read own profile" 
  ON user_profiles 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
  ON user_profiles 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles" 
  ON user_profiles 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for brands
CREATE POLICY "Anyone can read brands" 
  ON brands 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Admins can manage brands" 
  ON brands 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for models
CREATE POLICY "Anyone can read models" 
  ON models 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Admins can manage models" 
  ON models 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create a function to make a user admin
CREATE OR REPLACE FUNCTION make_user_admin(user_email text)
RETURNS void AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Update or insert user_profile
  INSERT INTO user_profiles (user_id, email, role)
  VALUES (user_id, user_email, 'admin')
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'admin', updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 