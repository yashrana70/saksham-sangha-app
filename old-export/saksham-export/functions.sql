CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin new.updated_at = now(); return new; end; $function$


---

CREATE OR REPLACE FUNCTION public.get_team_pending_today(_root uuid)
 RETURNS TABLE(user_id uuid, name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, COALESCE(p.full_name, 'Devotee')
  FROM public.profiles p
  WHERE p.id IN (SELECT user_id FROM public.get_downline_ids(_root) WHERE user_id <> _root)
    AND NOT EXISTS (
      SELECT 1 FROM public.sadhna_entries e
      WHERE e.user_id = p.id AND e.entry_date = CURRENT_DATE
    )
  ORDER BY p.full_name;
$function$


---

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, full_name, email, phone, devotee_level, facilitator_name)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'devotee_level',
    new.raw_user_meta_data->>'facilitator_name'
  );
  return new;
end; $function$


---

CREATE OR REPLACE FUNCTION public.get_team_stats(_root uuid)
 RETURNS TABLE(total_devotees bigint, submitted_today bigint, pending_today bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH d AS (
    SELECT user_id FROM public.get_downline_ids(_root) WHERE user_id <> _root
  ),
  sub AS (
    SELECT DISTINCT user_id FROM public.sadhna_entries
    WHERE entry_date = CURRENT_DATE AND user_id IN (SELECT user_id FROM d)
  )
  SELECT
    (SELECT count(*) FROM d) AS total_devotees,
    (SELECT count(*) FROM sub) AS submitted_today,
    (SELECT count(*) FROM d) - (SELECT count(*) FROM sub) AS pending_today;
$function$


---

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$


---

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'devotee')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$


---

CREATE OR REPLACE FUNCTION public.get_birthdays_today()
 RETURNS TABLE(user_id uuid, name text, dob date)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT id AS user_id, COALESCE(full_name, 'Devotee') AS name, dob
  FROM public.profiles
  WHERE dob IS NOT NULL
    AND EXTRACT(MONTH FROM dob) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY FROM dob) = EXTRACT(DAY FROM CURRENT_DATE);
$function$


---

CREATE OR REPLACE FUNCTION public.admin_delete_devotee(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$


---

CREATE OR REPLACE FUNCTION public.get_team_upcoming_birthdays(_root uuid, _days integer DEFAULT 7)
 RETURNS TABLE(user_id uuid, name text, dob date, days_until integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, COALESCE(p.full_name, 'Devotee'), p.dob,
    ((to_char(p.dob,'MMDD')::int
      - to_char(CURRENT_DATE,'MMDD')::int + 1000) % 1000)::int AS days_until
  FROM public.profiles p
  WHERE p.dob IS NOT NULL
    AND p.id IN (SELECT user_id FROM public.get_downline_ids(_root))
    AND ((to_char(p.dob,'MMDD')::int - to_char(CURRENT_DATE,'MMDD')::int + 1000) % 1000) <= _days
  ORDER BY days_until ASC;
$function$


---

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
$function$


---

CREATE OR REPLACE FUNCTION public.get_downline_ids(_root uuid)
 RETURNS TABLE(user_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH RECURSIVE tree AS (
    SELECT id FROM public.profiles WHERE id = _root
    UNION ALL
    SELECT p.id FROM public.profiles p
    JOIN tree t ON p.parent_id = t.id
  )
  SELECT id AS user_id FROM tree;
$function$


---

CREATE OR REPLACE FUNCTION public.get_hierarchy_tree()
 RETURNS TABLE(id uuid, name text, role text, parent_id uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN QUERY
      SELECT p.id, COALESCE(p.full_name, 'Devotee'),
        (SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = p.id ORDER BY
          CASE ur.role::text WHEN 'admin' THEN 1 WHEN 'facilitator' THEN 2 ELSE 3 END LIMIT 1),
        p.parent_id
      FROM public.profiles p;
  ELSE
    RETURN QUERY
      SELECT p.id, COALESCE(p.full_name, 'Devotee'),
        (SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = p.id ORDER BY
          CASE ur.role::text WHEN 'admin' THEN 1 WHEN 'facilitator' THEN 2 ELSE 3 END LIMIT 1),
        p.parent_id
      FROM public.profiles p
      WHERE p.id IN (SELECT user_id FROM public.get_downline_ids(auth.uid()));
  END IF;
END;
$function$


---

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
$function$


---

CREATE OR REPLACE FUNCTION public.has_downline_access(_viewer uuid, _target uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    public.has_role(_viewer, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.get_downline_ids(_viewer) d WHERE d.user_id = _target
    );
$function$

