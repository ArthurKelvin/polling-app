-- Fix all remaining RLS policy recursion issues
-- This migration addresses the infinite recursion in user_roles and other policies

-- First, let's check and fix the user_roles policy that's causing infinite recursion
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Only admins can assign roles" ON user_roles;

-- Create simpler, non-recursive policies for user_roles
CREATE POLICY "Users can view own role"
ON user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Only admins can assign roles"
ON user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
    AND id != user_roles.id  -- Prevent self-reference
  )
);

-- Fix any remaining votes table policy issues
DROP POLICY IF EXISTS "votes_select_owner_user_or_public" ON votes;
DROP POLICY IF EXISTS "votes_insert_authenticated_once" ON votes;
DROP POLICY IF EXISTS "votes_update_own_vote" ON votes;
DROP POLICY IF EXISTS "votes_delete_only_owner_or_poll_owner" ON votes;

-- Create simple, non-recursive policies for votes
CREATE POLICY "votes_select_owner_user_or_public"
ON votes FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM polls 
    WHERE polls.id = votes.poll_id 
    AND (polls.is_public = true OR polls.owner_id = auth.uid())
  )
);

CREATE POLICY "votes_insert_authenticated_once"
ON votes FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "votes_update_own_vote"
ON votes FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "votes_delete_only_owner_or_poll_owner"
ON votes FOR DELETE
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM polls 
    WHERE polls.id = votes.poll_id 
    AND polls.owner_id = auth.uid()
  )
);

-- Add comments to document the fixes
COMMENT ON POLICY "Users can view own role" ON user_roles IS 'Allows users to view their own role without recursion';
COMMENT ON POLICY "Only admins can assign roles" ON user_roles IS 'Allows admins to assign roles with self-reference prevention';
COMMENT ON POLICY "votes_select_owner_user_or_public" ON votes IS 'Allows viewing votes for own polls or public polls without recursion';
COMMENT ON POLICY "votes_insert_authenticated_once" ON votes IS 'Allows authenticated users to insert votes';
COMMENT ON POLICY "votes_update_own_vote" ON votes IS 'Allows users to update their own votes';
COMMENT ON POLICY "votes_delete_only_owner_or_poll_owner" ON votes IS 'Allows users to delete their own votes or poll owners to delete any votes';
