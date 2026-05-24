
ALTER TABLE public.sadhna_entries
  ADD COLUMN IF NOT EXISTS study_hours numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exercise_minutes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS morning_japa_attended boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS morning_japa_duration integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS positive_chetna text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS negative_chetna text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS weekly_bonus integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_details text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bhakti_vriksha_level integer;

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
