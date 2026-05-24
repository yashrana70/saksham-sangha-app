
CREATE TABLE IF NOT EXISTS public.hierarchy_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'devotee', -- admin | facilitator | devotee
  parent_id uuid REFERENCES public.hierarchy_nodes(id) ON DELETE SET NULL,
  linked_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hierarchy_parent ON public.hierarchy_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_linked ON public.hierarchy_nodes(linked_user_id);

ALTER TABLE public.hierarchy_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hierarchy readable by authenticated" ON public.hierarchy_nodes;
CREATE POLICY "Hierarchy readable by authenticated"
  ON public.hierarchy_nodes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Hierarchy admin manage" ON public.hierarchy_nodes;
CREATE POLICY "Hierarchy admin manage"
  ON public.hierarchy_nodes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
