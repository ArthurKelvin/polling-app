-- Add votes column to poll_options table
-- This column tracks the number of votes for each option

-- Add votes column to poll_options table
ALTER TABLE public.poll_options 
ADD COLUMN IF NOT EXISTS votes INTEGER DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_poll_options_votes ON public.poll_options(votes);

-- Update existing poll options with their current vote counts
UPDATE public.poll_options 
SET votes = (
  SELECT COUNT(*) 
  FROM public.votes 
  WHERE option_id = poll_options.id
);

-- Add a comment to document the column
COMMENT ON COLUMN public.poll_options.votes IS 'Number of votes cast for this option, automatically maintained by application logic';
