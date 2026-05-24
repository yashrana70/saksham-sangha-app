
-- 1. Add 'facilitator' to app_role enum (if not present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'facilitator'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'facilitator';
  END IF;
END$$;

-- 2. parent_id on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_parent_id ON public.profiles(parent_id);

-- 3. Recursive downline function (returns all descendant user_ids of a given user, INCLUDING self)
CREATE OR REPLACE FUNCTION public.get_downline_ids(_root uuid)
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE tree AS (
    SELECT id FROM public.profiles WHERE id = _root
    UNION ALL
    SELECT p.id FROM public.profiles p
    JOIN tree t ON p.parent_id = t.id
  )
  SELECT id AS user_id FROM tree;
$$;

-- 4. has_downline_access(viewer, target): true if viewer is admin OR target is in viewer's downline
CREATE OR REPLACE FUNCTION public.has_downline_access(_viewer uuid, _target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_viewer, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.get_downline_ids(_viewer) d WHERE d.user_id = _target
    );
$$;

-- 5. RLS: Facilitators can view profiles and sadhna of their downline
DROP POLICY IF EXISTS "Facilitators can view downline profiles" ON public.profiles;
CREATE POLICY "Facilitators can view downline profiles"
  ON public.profiles FOR SELECT
  USING (public.has_downline_access(auth.uid(), id));

DROP POLICY IF EXISTS "Facilitators can view downline sadhna" ON public.sadhna_entries;
CREATE POLICY "Facilitators can view downline sadhna"
  ON public.sadhna_entries FOR SELECT
  USING (public.has_downline_access(auth.uid(), user_id));

-- 6. Dashboard helpers
CREATE OR REPLACE FUNCTION public.get_team_stats(_root uuid)
RETURNS TABLE(
  total_devotees bigint,
  submitted_today bigint,
  pending_today bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_team_pending_today(_root uuid)
RETURNS TABLE(user_id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, COALESCE(p.full_name, 'Devotee')
  FROM public.profiles p
  WHERE p.id IN (SELECT user_id FROM public.get_downline_ids(_root) WHERE user_id <> _root)
    AND NOT EXISTS (
      SELECT 1 FROM public.sadhna_entries e
      WHERE e.user_id = p.id AND e.entry_date = CURRENT_DATE
    )
  ORDER BY p.full_name;
$$;

CREATE OR REPLACE FUNCTION public.get_team_upcoming_birthdays(_root uuid, _days integer DEFAULT 7)
RETURNS TABLE(user_id uuid, name text, dob date, days_until integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, COALESCE(p.full_name, 'Devotee'), p.dob,
    ((to_char(p.dob,'MMDD')::int
      - to_char(CURRENT_DATE,'MMDD')::int + 1000) % 1000)::int AS days_until
  FROM public.profiles p
  WHERE p.dob IS NOT NULL
    AND p.id IN (SELECT user_id FROM public.get_downline_ids(_root))
    AND ((to_char(p.dob,'MMDD')::int - to_char(CURRENT_DATE,'MMDD')::int + 1000) % 1000) <= _days
  ORDER BY days_until ASC;
$$;

-- 7. Admin can update parent_id (already covered by "Admins can update all profiles")
-- Allow admins to set facilitator role: covered by "Admins can manage roles"

-- 8. Hierarchy tree view function (returns full tree for admin, downline for facilitator)
CREATE OR REPLACE FUNCTION public.get_hierarchy_tree()
RETURNS TABLE(id uuid, name text, role text, parent_id uuid)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;
