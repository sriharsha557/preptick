-- Create Admin User for Testing
-- Email: admin@preptick.com
-- Password: Admin@123

-- First, create the user in Supabase Auth (you'll need to do this via Supabase Dashboard or API)
-- Then insert the user profile in the database

-- Insert admin user profile
-- Note: The user ID should match the Supabase Auth user ID
-- For now, we'll use a placeholder UUID that you'll need to replace after creating the auth user

INSERT INTO "User" (
  id,
  email,
  "passwordHash",
  curriculum,
  grade,
  subjects,
  "createdAt",
  "lastLogin"
) VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual Supabase Auth user ID
  'admin@preptick.com',
  '$2b$10$placeholder', -- This will be managed by Supabase Auth
  'CBSE',
  10,
  '["Mathematics", "Science", "English"]',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  "lastLogin" = NOW();

-- Instructions:
-- 1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/mqeenbberuxzqtngkygh
-- 2. Navigate to Authentication > Users
-- 3. Click "Add User" and create:
--    - Email: admin@preptick.com
--    - Password: Admin@123
--    - Auto Confirm User: Yes
-- 4. Copy the generated User ID
-- 5. Update the INSERT statement above with the actual User ID
-- 6. Run this SQL in the SQL Editor

-- Alternative: Use Supabase API to create the user programmatically
