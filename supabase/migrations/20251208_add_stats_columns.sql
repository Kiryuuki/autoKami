-- Add statistics columns to kami_profiles
ALTER TABLE kami_profiles ADD COLUMN IF NOT EXISTS total_harvests INTEGER DEFAULT 0;
ALTER TABLE kami_profiles ADD COLUMN IF NOT EXISTS total_rests INTEGER DEFAULT 0;
ALTER TABLE kami_profiles ADD COLUMN IF NOT EXISTS automation_started_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for potential sorting/filtering
CREATE INDEX IF NOT EXISTS idx_kami_profiles_automation_started_at ON kami_profiles(automation_started_at);
