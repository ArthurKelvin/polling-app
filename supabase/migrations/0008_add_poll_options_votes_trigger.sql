-- Add trigger to automatically update poll_options.votes column
-- This ensures vote counts are maintained when votes are inserted/updated/deleted

-- Function to update poll_options vote counts
CREATE OR REPLACE FUNCTION public.update_poll_options_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update the new option's vote count
    UPDATE public.poll_options 
    SET votes = (
      SELECT COUNT(*) 
      FROM public.votes 
      WHERE option_id = NEW.option_id
    )
    WHERE id = NEW.option_id;
    
    -- If this is an UPDATE and the option changed, update the old option too
    IF TG_OP = 'UPDATE' AND OLD.option_id != NEW.option_id THEN
      UPDATE public.poll_options 
      SET votes = (
        SELECT COUNT(*) 
        FROM public.votes 
        WHERE option_id = OLD.option_id
      )
      WHERE id = OLD.option_id;
    END IF;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    UPDATE public.poll_options 
    SET votes = (
      SELECT COUNT(*) 
      FROM public.votes 
      WHERE option_id = OLD.option_id
    )
    WHERE id = OLD.option_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for poll_options vote count updates
DROP TRIGGER IF EXISTS trg_update_poll_options_vote_count ON public.votes;
CREATE TRIGGER trg_update_poll_options_vote_count
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_poll_options_vote_count();

-- Update the comment to reflect that it's now automatically maintained
COMMENT ON COLUMN public.poll_options.votes IS 'Number of votes cast for this option, automatically maintained by database triggers';
