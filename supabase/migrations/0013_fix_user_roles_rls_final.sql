-- Fix user_roles RLS policies to prevent infinite recursion
-- This migration completely rebuilds the RLS policies for user_roles

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can assign roles" ON user_roles;

-- Disable RLS temporarily to allow policy recreation
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "users_can_view_own_role"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- Policy for role management - only allow if user is admin
-- Use a function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user has admin role
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

CREATE POLICY "admins_can_manage_roles"
ON public.user_roles FOR ALL
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;

-- Add comments
COMMENT ON POLICY "users_can_view_own_role" ON public.user_roles IS 'Allows users to view their own role without recursion';
COMMENT ON POLICY "admins_can_manage_roles" ON public.user_roles IS 'Allows admins to manage all user roles';
COMMENT ON FUNCTION is_admin_user() IS 'Helper function to check if current user is admin without causing RLS recursion';

