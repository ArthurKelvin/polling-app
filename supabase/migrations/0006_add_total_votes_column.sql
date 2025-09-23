-- Add missing total_votes column to polls table
-- This migration fixes the missing column that the trigger function expects

-- Add total_votes column to polls table
ALTER TABLE public.polls 
ADD COLUMN IF NOT EXISTS total_votes INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_polls_total_votes ON public.polls(total_votes);

-- Update existing polls with their current vote counts
UPDATE public.polls 
SET total_votes = (
  SELECT COUNT(*) 
  FROM public.votes 
  WHERE poll_id = polls.id
);

-- Add a comment to document the column
COMMENT ON COLUMN public.polls.total_votes IS 'Total number of votes cast for this poll, automatically maintained by trigger';

