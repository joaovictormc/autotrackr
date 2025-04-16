/*
  # Add name field to users table

  1. Changes
    - Add `name` column to `users` table
    - Add policy to allow users to update their own name
*/

ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS raw_user_meta_data jsonb;

CREATE POLICY "Users can update own name"
  ON auth.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);