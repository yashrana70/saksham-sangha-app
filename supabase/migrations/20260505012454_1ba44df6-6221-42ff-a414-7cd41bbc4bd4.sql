CREATE OR REPLACE FUNCTION public.get_birthdays_today()
RETURNS TABLE(user_id uuid, name text, dob date)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id AS user_id, COALESCE(full_name, 'Devotee') AS name, dob
  FROM public.profiles
  WHERE dob IS NOT NULL
    AND EXTRACT(MONTH FROM dob) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY FROM dob) = EXTRACT(DAY FROM CURRENT_DATE);
$$;

REVOKE EXECUTE ON FUNCTION public.get_birthdays_today() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_birthdays_today() TO authenticated;