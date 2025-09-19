-- Add poll comments and discussion system
-- This migration adds commenting functionality to polls

-- Create poll_comments table
CREATE TABLE IF NOT EXISTS poll_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES poll_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 1000),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_poll_comments_poll_id ON poll_comments(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_comments_user_id ON poll_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_comments_parent_id ON poll_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_poll_comments_created_at ON poll_comments(created_at);

-- Create function to get comment count for a poll
CREATE OR REPLACE FUNCTION get_poll_comment_count(poll_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM poll_comments 
    WHERE poll_id = poll_uuid 
    AND is_deleted = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get comments for a poll with user info
CREATE OR REPLACE FUNCTION get_poll_comments(poll_uuid UUID, limit_count INTEGER DEFAULT 50, offset_count INTEGER DEFAULT 0)
RETURNS TABLE(
  id UUID,
  poll_id UUID,
  user_id UUID,
  parent_id UUID,
  content TEXT,
  is_deleted BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_email TEXT,
  user_created_at TIMESTAMP WITH TIME ZONE,
  reply_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id,
    pc.poll_id,
    pc.user_id,
    pc.parent_id,
    pc.content,
    pc.is_deleted,
    pc.created_at,
    pc.updated_at,
    au.email as user_email,
    au.created_at as user_created_at,
    COALESCE(reply_counts.reply_count, 0)::INTEGER as reply_count
  FROM poll_comments pc
  JOIN auth.users au ON pc.user_id = au.id
  LEFT JOIN (
    SELECT parent_id, COUNT(*) as reply_count
    FROM poll_comments
    WHERE is_deleted = FALSE
    GROUP BY parent_id
  ) reply_counts ON pc.id = reply_counts.parent_id
  WHERE pc.poll_id = poll_uuid 
  AND pc.is_deleted = FALSE
  AND pc.parent_id IS NULL
  ORDER BY pc.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get replies for a comment
CREATE OR REPLACE FUNCTION get_comment_replies(comment_uuid UUID)
RETURNS TABLE(
  id UUID,
  poll_id UUID,
  user_id UUID,
  parent_id UUID,
  content TEXT,
  is_deleted BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_email TEXT,
  user_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.id,
    pc.poll_id,
    pc.user_id,
    pc.parent_id,
    pc.content,
    pc.is_deleted,
    pc.created_at,
    pc.updated_at,
    au.email as user_email,
    au.created_at as user_created_at
  FROM poll_comments pc
  JOIN auth.users au ON pc.user_id = au.id
  WHERE pc.parent_id = comment_uuid 
  AND pc.is_deleted = FALSE
  ORDER BY pc.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to soft delete a comment
CREATE OR REPLACE FUNCTION soft_delete_comment(comment_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  comment_owner UUID;
  user_role VARCHAR(20);
BEGIN
  -- Get comment owner
  SELECT user_id INTO comment_owner
  FROM poll_comments
  WHERE id = comment_uuid;
  
  -- Check if user is the owner or has delete permission
  IF comment_owner = user_uuid THEN
    -- User is the owner, allow deletion
    UPDATE poll_comments 
    SET is_deleted = TRUE, updated_at = NOW()
    WHERE id = comment_uuid;
    RETURN TRUE;
  ELSE
    -- Check if user has moderator/admin permissions
    SELECT get_user_role(user_uuid) INTO user_role;
    IF user_role IN ('moderator', 'admin') THEN
      UPDATE poll_comments 
      SET is_deleted = TRUE, updated_at = NOW()
      WHERE id = comment_uuid;
      RETURN TRUE;
    ELSE
      RETURN FALSE;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for poll_comments
ALTER TABLE poll_comments ENABLE ROW LEVEL SECURITY;

-- Users can view all non-deleted comments
CREATE POLICY "Users can view non-deleted comments" ON poll_comments
  FOR SELECT USING (is_deleted = FALSE);

-- Users can create comments
CREATE POLICY "Authenticated users can create comments" ON poll_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON poll_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments, moderators can delete any
CREATE POLICY "Users can delete own comments" ON poll_comments
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role IN ('moderator', 'admin')
    )
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON poll_comments TO authenticated;
GRANT EXECUTE ON FUNCTION get_poll_comment_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_poll_comments(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_comment_replies(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_comment(UUID, UUID) TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_poll_comments_updated_at
  BEFORE UPDATE ON poll_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_updated_at();
