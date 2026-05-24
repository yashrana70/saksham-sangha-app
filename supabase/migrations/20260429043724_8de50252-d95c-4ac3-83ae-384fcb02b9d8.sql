ALTER TABLE public.sadhna_entries
  ADD COLUMN IF NOT EXISTS hearing_topic text,
  ADD COLUMN IF NOT EXISTS reading_topic text,
  ADD COLUMN IF NOT EXISTS devotee_name text;