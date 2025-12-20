-- Add auto_revive column to kami_profiles table
ALTER TABLE kami_profiles 
ADD COLUMN IF NOT EXISTS auto_revive BOOLEAN DEFAULT false;
