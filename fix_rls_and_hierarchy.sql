-- 1. Create a helper function that runs with SECURITY DEFINER to bypass RLS
-- This prevents the infinite recursion when the policy itself tries to query user_roles
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql;

-- 2. Drop the recursive policies on user_roles
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can modify roles" ON user_roles;

-- 3. Recreate the policies using the safe helper function
CREATE POLICY "Admins can read all roles" ON user_roles FOR SELECT USING (is_admin());
CREATE POLICY "Only admins can modify roles" ON user_roles FOR ALL USING (is_admin());

-- 4. Update announcements policy to use the helper as well for safety
DROP POLICY IF EXISTS "Only admins can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Only admins can update announcements" ON announcements;
DROP POLICY IF EXISTS "Only admins can delete announcements" ON announcements;

CREATE POLICY "Only admins can insert announcements" ON announcements FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Only admins can update announcements" ON announcements FOR UPDATE USING (is_admin());
CREATE POLICY "Only admins can delete announcements" ON announcements FOR DELETE USING (is_admin());

-- 5. Fix `get_downline_ids` to actually traverse the hierarchy!
CREATE OR REPLACE FUNCTION get_downline_ids(_root UUID)
RETURNS TABLE (user_id UUID) SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE downline AS (
        -- Base case: the direct children of the root (e.g. Volunteers under an Operator)
        SELECT id FROM profiles WHERE parent_id = _root
        UNION
        -- Recursive step: children of the children (e.g. Devotees under a Volunteer)
        SELECT p.id FROM profiles p
        INNER JOIN downline d ON p.parent_id = d.id
    )
    SELECT id FROM downline;
END;
$$ LANGUAGE plpgsql;
