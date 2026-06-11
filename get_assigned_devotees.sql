-- Run this script in your Supabase SQL Editor to allow Operators and Volunteers
-- to fetch only the devotees that are assigned under them in the hierarchy.

CREATE OR REPLACE FUNCTION get_assigned_devotees(parent_user_id UUID)
RETURNS TABLE (user_id UUID)
SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE subordinates AS (
        -- Base case: find the node linked to the given user
        SELECT h.id, h.linked_user_id
        FROM hierarchy_nodes h
        WHERE h.linked_user_id = parent_user_id
        
        UNION
        
        -- Recursive step: find all children of the nodes found so far
        SELECT h.id, h.linked_user_id
        FROM hierarchy_nodes h
        INNER JOIN subordinates s ON h.parent_id = s.id
    )
    SELECT s.linked_user_id
    FROM subordinates s
    WHERE s.linked_user_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
