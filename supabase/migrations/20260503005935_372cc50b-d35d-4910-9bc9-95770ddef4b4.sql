
ALTER TABLE public.sadhna_entries
  ADD COLUMN IF NOT EXISTS chanting_completion_time time,
  ADD COLUMN IF NOT EXISTS day_rest_minutes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_rounds integer DEFAULT 16,
  ADD COLUMN IF NOT EXISTS total_marks integer;

-- Admin: delete a devotee (auth user + cascading data)
CREATE OR REPLACE FUNCTION public.admin_delete_devotee(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;
  DELETE FROM public.sadhna_entries WHERE user_id = _user_id;
  DELETE FROM public.todo_items WHERE user_id = _user_id;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE id = _user_id;
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_devotee(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_devotee(uuid) TO authenticated;
