-- This script finds your email and promotes you to 'admin'
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find the user ID for sonuranaas56@gmail.com
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'sonuranaas56@gmail.com';
  
  IF target_user_id IS NOT NULL THEN
    -- Check if they already have a role
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_user_id) THEN
      UPDATE user_roles SET role = 'admin' WHERE user_id = target_user_id;
    ELSE
      INSERT INTO user_roles (user_id, role) VALUES (target_user_id, 'admin');
    END IF;
  END IF;
END $$;
