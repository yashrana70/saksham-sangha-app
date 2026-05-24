-- 1) Unique entry per user per day
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sadhna_entries_user_date_unique'
  ) THEN
    -- Remove duplicates first if any (keep most recent)
    DELETE FROM public.sadhna_entries a
    USING public.sadhna_entries b
    WHERE a.user_id = b.user_id
      AND a.entry_date = b.entry_date
      AND a.created_at < b.created_at;
    ALTER TABLE public.sadhna_entries
      ADD CONSTRAINT sadhna_entries_user_date_unique UNIQUE (user_id, entry_date);
  END IF;
END $$;

-- 2) Leaderboard: only rank devotees who attended morning japa
CREATE OR REPLACE FUNCTION public.get_devotee_leaderboard(_limit integer DEFAULT 10)
 RETURNS TABLE(user_id uuid, name text, days_tracked bigint, avg_score numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH recent AS (
    SELECT
      e.user_id,
      e.entry_date,
      COALESCE(e.devotee_name, p.full_name, 'Devotee') AS display_name,
      COALESCE(e.total_marks, 0)::numeric AS score
    FROM public.sadhna_entries e
    LEFT JOIN public.profiles p ON p.id = e.user_id
    WHERE e.entry_date >= (CURRENT_DATE - INTERVAL '7 days')
      AND COALESCE(e.morning_japa_attended, false) = true
  ),
  agg AS (
    SELECT
      user_id,
      (ARRAY_AGG(display_name ORDER BY entry_date DESC))[1] AS name,
      COUNT(DISTINCT entry_date) AS days_tracked,
      ROUND(AVG(score)::numeric, 2) AS avg_score
    FROM recent
    GROUP BY user_id
  )
  SELECT user_id, name, days_tracked, avg_score
  FROM agg
  WHERE days_tracked >= 1
  ORDER BY avg_score DESC
  LIMIT _limit;
$function$;

-- 3) Upcoming birthdays (today + tomorrow)
CREATE OR REPLACE FUNCTION public.get_upcoming_birthdays()
 RETURNS TABLE(user_id uuid, name text, dob date, days_until integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id AS user_id,
         COALESCE(full_name, 'Devotee') AS name,
         dob,
         CASE
           WHEN EXTRACT(MONTH FROM dob) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(DAY FROM dob)   = EXTRACT(DAY FROM CURRENT_DATE) THEN 0
           ELSE 1
         END AS days_until
  FROM public.profiles
  WHERE dob IS NOT NULL
    AND (
      (EXTRACT(MONTH FROM dob) = EXTRACT(MONTH FROM CURRENT_DATE)
       AND EXTRACT(DAY FROM dob) = EXTRACT(DAY FROM CURRENT_DATE))
      OR
      (EXTRACT(MONTH FROM dob) = EXTRACT(MONTH FROM (CURRENT_DATE + INTERVAL '1 day'))
       AND EXTRACT(DAY FROM dob) = EXTRACT(DAY FROM (CURRENT_DATE + INTERVAL '1 day')))
    )
  ORDER BY days_until ASC, name ASC;
$function$;