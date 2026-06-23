CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  donor_name TEXT,
  mobile_number TEXT,
  email TEXT,
  amount NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'pending' NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT
);

-- Enable RLS
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own donations
CREATE POLICY "Users can view own donations" ON donations
  FOR SELECT USING (auth.uid() = user_id);

-- Allow admins to read all donations
CREATE POLICY "Admins can view all donations" ON donations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Allow everyone to read settings (for the UI to fetch banner and stats)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read app_settings" ON app_settings
  FOR SELECT USING (true);

-- Allow admins to update settings
CREATE POLICY "Admins can manage app_settings" ON app_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Insert default settings
INSERT INTO app_settings (key, value) VALUES (
  'donation_popup_config',
  '{"banner_url": "https://images.unsplash.com/photo-1582610211634-192663eb4c7e?w=800&q=80", "books_distributed": 5420, "prasadam_served": 12500, "events_conducted": 340}'
) ON CONFLICT (key) DO NOTHING;
