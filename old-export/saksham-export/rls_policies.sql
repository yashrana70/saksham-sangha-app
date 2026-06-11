-- POLICY "Profiles select own" on public.profiles
CREATE POLICY "Profiles select own" ON public.profiles AS PERMISSIVE FOR SELECT TO  USING ((auth.uid() = id));

-- POLICY "Profiles insert own" on public.profiles
CREATE POLICY "Profiles insert own" ON public.profiles AS PERMISSIVE FOR INSERT TO  WITH CHECK ((auth.uid() = id));

-- POLICY "Profiles update own" on public.profiles
CREATE POLICY "Profiles update own" ON public.profiles AS PERMISSIVE FOR UPDATE TO  USING ((auth.uid() = id));

-- POLICY "Sadhna select own" on public.sadhna_entries
CREATE POLICY "Sadhna select own" ON public.sadhna_entries AS PERMISSIVE FOR SELECT TO  USING ((auth.uid() = user_id));

-- POLICY "Sadhna insert own" on public.sadhna_entries
CREATE POLICY "Sadhna insert own" ON public.sadhna_entries AS PERMISSIVE FOR INSERT TO  WITH CHECK ((auth.uid() = user_id));

-- POLICY "Sadhna update own" on public.sadhna_entries
CREATE POLICY "Sadhna update own" ON public.sadhna_entries AS PERMISSIVE FOR UPDATE TO  USING ((auth.uid() = user_id));

-- POLICY "Sadhna delete own" on public.sadhna_entries
CREATE POLICY "Sadhna delete own" ON public.sadhna_entries AS PERMISSIVE FOR DELETE TO  USING ((auth.uid() = user_id));

-- POLICY "Events readable by authenticated" on public.vaishnav_events
CREATE POLICY "Events readable by authenticated" ON public.vaishnav_events AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- POLICY "Users can view own roles" on public.user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO  USING ((auth.uid() = user_id));

-- POLICY "Admins can view all roles" on public.user_roles
CREATE POLICY "Admins can view all roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO  USING (has_role(auth.uid(), 'admin'::app_role));

-- POLICY "Admins can manage roles" on public.user_roles
CREATE POLICY "Admins can manage roles" ON public.user_roles AS PERMISSIVE FOR ALL TO  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- POLICY "Admins can view all sadhna entries" on public.sadhna_entries
CREATE POLICY "Admins can view all sadhna entries" ON public.sadhna_entries AS PERMISSIVE FOR SELECT TO  USING (has_role(auth.uid(), 'admin'::app_role));

-- POLICY "Admins can view all profiles" on public.profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO  USING (has_role(auth.uid(), 'admin'::app_role));

-- POLICY "Todos select own" on public.todo_items
CREATE POLICY "Todos select own" ON public.todo_items AS PERMISSIVE FOR SELECT TO  USING ((auth.uid() = user_id));

-- POLICY "Todos insert own" on public.todo_items
CREATE POLICY "Todos insert own" ON public.todo_items AS PERMISSIVE FOR INSERT TO  WITH CHECK ((auth.uid() = user_id));

-- POLICY "Todos update own" on public.todo_items
CREATE POLICY "Todos update own" ON public.todo_items AS PERMISSIVE FOR UPDATE TO  USING ((auth.uid() = user_id));

-- POLICY "Todos delete own" on public.todo_items
CREATE POLICY "Todos delete own" ON public.todo_items AS PERMISSIVE FOR DELETE TO  USING ((auth.uid() = user_id));

-- POLICY "Admins can view all todos" on public.todo_items
CREATE POLICY "Admins can view all todos" ON public.todo_items AS PERMISSIVE FOR SELECT TO  USING (has_role(auth.uid(), 'admin'::app_role));

-- POLICY "Admins can update all profiles" on public.profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles AS PERMISSIVE FOR UPDATE TO  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- POLICY "Facilitators can view downline profiles" on public.profiles
CREATE POLICY "Facilitators can view downline profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO  USING (has_downline_access(auth.uid(), id));

-- POLICY "Facilitators can view downline sadhna" on public.sadhna_entries
CREATE POLICY "Facilitators can view downline sadhna" ON public.sadhna_entries AS PERMISSIVE FOR SELECT TO  USING (has_downline_access(auth.uid(), user_id));

-- POLICY "Hierarchy readable by authenticated" on public.hierarchy_nodes
CREATE POLICY "Hierarchy readable by authenticated" ON public.hierarchy_nodes AS PERMISSIVE FOR SELECT TO authenticated USING (true);

-- POLICY "Hierarchy admin manage" on public.hierarchy_nodes
CREATE POLICY "Hierarchy admin manage" ON public.hierarchy_nodes AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
