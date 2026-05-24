REVOKE EXECUTE ON FUNCTION public.get_devotee_leaderboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_devotee_leaderboard(integer) TO authenticated;