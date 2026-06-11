-- Add new extended profile fields requested by the user
-- Run this script in your Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS spiritual_background TEXT,
ADD COLUMN IF NOT EXISTS joined_iskcon_date DATE,
ADD COLUMN IF NOT EXISTS iskcon_intro_source TEXT,
ADD COLUMN IF NOT EXISTS started_japa_date DATE,
ADD COLUMN IF NOT EXISTS diksha_date DATE,
ADD COLUMN IF NOT EXISTS saksham_seva_start_date DATE,
ADD COLUMN IF NOT EXISTS saksham_vision TEXT;
