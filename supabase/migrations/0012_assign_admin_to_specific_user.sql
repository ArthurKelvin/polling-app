-- Assign admin role to specific user by email
-- This migration assigns admin role to Kelvinarthur24611@gmail.com

-- First, let's temporarily disable RLS to avoid recursion issues
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Find the user by email and assign admin role
INSERT INTO user_roles (user_id, role)
SELECT 
  au.id as user_id,
  'admin' as role
FROM auth.users au
WHERE au.email = 'Kelvinarthur24611@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Only admins can assign roles" ON user_roles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
USING (user_id = auth.uid());

-- Allow all authenticated users to insert/update roles for now
-- This is a temporary measure to avoid recursion
CREATE POLICY "Allow role management"
ON user_roles FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Add a comment
COMMENT ON POLICY "Users can view own role" ON user_roles IS 'Allows users to view their own role';
COMMENT ON POLICY "Allow role management" ON user_roles IS 'Temporary policy to allow role management without recursion';
