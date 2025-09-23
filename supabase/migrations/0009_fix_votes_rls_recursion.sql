-- Fix infinite recursion in votes RLS policy
-- The current policy causes recursion when checking for existing votes

-- Drop the problematic policy
DROP POLICY IF EXISTS "votes_insert_authenticated_once" ON public.votes;

-- Create a simpler, non-recursive policy for vote insertion
CREATE POLICY "votes_insert_authenticated_once"
ON public.votes FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Add a policy for vote updates (for upsert operations)
DROP POLICY IF EXISTS "votes_update_own_vote" ON public.votes;
CREATE POLICY "votes_update_own_vote"
ON public.votes FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add a comment to document the fix
COMMENT ON POLICY "votes_insert_authenticated_once" ON public.votes IS 'Allows authenticated users to insert votes without recursive checks';
COMMENT ON POLICY "votes_update_own_vote" ON public.votes IS 'Allows users to update their own votes for upsert operations';
