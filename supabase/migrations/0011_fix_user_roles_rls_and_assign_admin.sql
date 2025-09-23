-- Fix user_roles RLS policies and assign admin role to current user
-- This migration fixes the infinite recursion and assigns admin role

-- First, let's temporarily disable RLS to fix the policies
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Only admins can assign roles" ON user_roles;

-- Re-enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
USING (user_id = auth.uid());

-- Create a policy that allows the first user (or a specific user) to become admin
-- This bypasses the recursion issue by not checking admin status in the same table
CREATE POLICY "Allow initial admin assignment"
ON user_roles FOR INSERT
WITH CHECK (true); -- Allow all inserts initially

CREATE POLICY "Allow admin role updates"
ON user_roles FOR UPDATE
USING (true) -- Allow all updates initially
WITH CHECK (true);

-- Now let's assign admin role to the current user
-- We'll use a function that bypasses RLS to assign the first admin
CREATE OR REPLACE FUNCTION assign_first_admin()
RETURNS VOID AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  IF current_user_id IS NOT NULL THEN
    -- Insert or update the user's role to admin
    INSERT INTO user_roles (user_id, role)
    VALUES (current_user_id, 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = 'admin',
      updated_at = NOW();
    
    RAISE NOTICE 'Admin role assigned to user: %', current_user_id;
  ELSE
    RAISE NOTICE 'No authenticated user found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to assign admin role
SELECT assign_first_admin();

-- Now create proper RLS policies that don't cause recursion
-- Drop the temporary policies
DROP POLICY IF EXISTS "Allow initial admin assignment" ON user_roles;
DROP POLICY IF EXISTS "Allow admin role updates" ON user_roles;

-- Policies will be created in the next migration

-- Add a comment to document the fix
COMMENT ON POLICY "Users can view own role" ON user_roles IS 'Allows users to view their own role without recursion';

-- Clean up the temporary function
DROP FUNCTION IF EXISTS assign_first_admin();

