-- 1. Create Enums
CREATE TYPE app_role AS ENUM ('admin', 'devotee', 'facilitator', 'operator', 'volunteer');

-- 2. Create Base Tables
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    gender TEXT,
    dob DATE,
    address TEXT,
    marital_status TEXT,
    education TEXT,
    profession TEXT,
    devotee_level TEXT,
    bhakti_vriksha_level INTEGER,
    spiritual_friend_name TEXT,
    assigned_mentor TEXT,
    photo_url TEXT,
    family JSONB,
    parent_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hierarchy_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT DEFAULT 'devotee',
    parent_id UUID REFERENCES hierarchy_nodes(id),
    linked_user_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sadhna_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    devotee_name TEXT,
    assigned_mentor TEXT,
    entry_date DATE NOT NULL,
    wake_up_time TIME,
    sleep_time TIME,
    japa_rounds INTEGER,
    morning_japa_attended BOOLEAN,
    morning_japa_duration INTEGER,
    chanting_completion_time TIME,
    reading_minutes INTEGER,
    reading_topic TEXT,
    hearing_minutes INTEGER,
    hearing_topic TEXT,
    study_hours INTEGER,
    exercise_minutes INTEGER,
    seva_minutes INTEGER,
    service_details TEXT,
    association_minutes INTEGER,
    day_rest_minutes INTEGER,
    positive_chetna TEXT[],
    negative_chetna TEXT[],
    notes TEXT,
    image_url TEXT,
    total_marks INTEGER,
    weekly_bonus INTEGER,
    target_rounds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS todo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT false,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vaishnav_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'important')),
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seva_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES auth.users(id) NOT NULL,
    assigned_by UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('sadhna-images', 'sadhna-images', false) ON CONFLICT (id) DO NOTHING;

-- 4. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hierarchy_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sadhna_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaishnav_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE seva_tasks ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Hierarchy readable by all logged in users" ON hierarchy_nodes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Hierarchy writable by admin only" ON hierarchy_nodes FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users view own sadhna" ON sadhna_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all sadhna" ON sadhna_entries FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'operator'))
);
CREATE POLICY "Users insert own sadhna" ON sadhna_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sadhna" ON sadhna_entries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own todos" ON todo_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own todos" ON todo_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own todos" ON todo_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own todos" ON todo_items FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view events" ON vaishnav_events FOR SELECT USING (true);

CREATE POLICY "Users can read own role" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all roles" ON user_roles FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Only admins can modify roles" ON user_roles FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can view announcements" ON announcements FOR SELECT USING (true);
CREATE POLICY "Only admins can insert announcements" ON announcements FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Only admins can update announcements" ON announcements FOR UPDATE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Only admins can delete announcements" ON announcements FOR DELETE USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can view all seva tasks" ON seva_tasks FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can view their own seva tasks" ON seva_tasks FOR SELECT USING (assigned_to = auth.uid() OR assigned_by = auth.uid());
CREATE POLICY "Admins can insert seva tasks" ON seva_tasks FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Operators can assign seva tasks" ON seva_tasks FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'operator') AND auth.uid() = assigned_by);
CREATE POLICY "Users can update their own seva tasks" ON seva_tasks FOR UPDATE USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

-- 6. Storage Policies
CREATE POLICY "Images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'sadhna-images');
CREATE POLICY "Anyone can upload an image." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'sadhna-images');

-- 7. Functions
CREATE OR REPLACE FUNCTION get_hierarchy_tree()
RETURNS TABLE (
    id UUID,
    name TEXT,
    role TEXT,
    parent_id UUID
) SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'operator', 'volunteer')) THEN
        RETURN QUERY SELECT h.id, h.name, h.role, h.parent_id FROM hierarchy_nodes h;
    ELSE
        RETURN QUERY SELECT h.id, h.name, h.role, h.parent_id FROM hierarchy_nodes h WHERE h.linked_user_id = auth.uid();
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_downline_ids(_root UUID)
RETURNS TABLE (user_id UUID) SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY SELECT h.linked_user_id FROM hierarchy_nodes h WHERE h.linked_user_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_devotee_leaderboard(_limit INTEGER DEFAULT 10)
RETURNS TABLE (user_id UUID, name TEXT, days_tracked BIGINT, avg_score NUMERIC) SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY 
    SELECT s.user_id, s.devotee_name as name, COUNT(s.id) as days_tracked, AVG(s.total_marks) as avg_score
    FROM sadhna_entries s
    GROUP BY s.user_id, s.devotee_name
    ORDER BY avg_score DESC
    LIMIT _limit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_upcoming_birthdays()
RETURNS TABLE (user_id UUID, name TEXT, dob DATE, days_until INTEGER) SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT p.id as user_id, p.full_name as name, p.dob, 0 as days_until
    FROM profiles p WHERE p.dob IS NOT NULL LIMIT 5;
END;
$$ LANGUAGE plpgsql;
