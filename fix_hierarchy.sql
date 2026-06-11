-- Run this in your Supabase SQL Editor to fix the Hierarchy system

CREATE OR REPLACE FUNCTION get_hierarchy_tree()
RETURNS TABLE (
    id UUID,
    name TEXT,
    role TEXT,
    parent_id UUID
) SECURITY DEFINER SET search_path = public AS $$
    SELECT h.id, h.name, h.role, h.parent_id 
    FROM hierarchy_nodes h
    WHERE 
        EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'operator', 'volunteer'))
        OR h.linked_user_id = auth.uid();
$$ LANGUAGE sql;
