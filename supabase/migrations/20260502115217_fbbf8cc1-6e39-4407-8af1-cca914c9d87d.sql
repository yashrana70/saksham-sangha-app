CREATE OR REPLACE FUNCTION public.get_devotee_leaderboard(_limit integer DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  name text,
  days_tracked bigint,
  avg_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH per_entry AS (
    SELECT
      e.user_id,
      e.entry_date,
      COALESCE(e.devotee_name, p.full_name, 'Devotee') AS display_name,
      (COALESCE(e.japa_rounds, 0))::numeric
        + (COALESCE(e.hearing_minutes, 0) + COALESCE(e.reading_minutes, 0) + COALESCE(e.seva_minutes, 0))::numeric / 15.0
        AS score
    FROM public.sadhna_entries e
    LEFT JOIN public.profiles p ON p.id = e.user_id
  ),
  agg AS (
    SELECT
      user_id,
      -- pick the most recent non-null devotee/profile name
      (ARRAY_AGG(display_name ORDER BY entry_date DESC))[1] AS name,
      COUNT(DISTINCT entry_date) AS days_tracked,
      ROUND(AVG(score)::numeric, 2) AS avg_score
    FROM per_entry
    GROUP BY user_id
  )
  SELECT user_id, name, days_tracked, avg_score
  FROM agg
  WHERE days_tracked >= 1
  ORDER BY avg_score DESC
  LIMIT _limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_devotee_leaderboard(integer) TO authenticated;