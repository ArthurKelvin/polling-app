/**
 * Comment and discussion types for the polling app
 */

export interface PollComment {
  id: string;
  poll_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user_email: string;
  user_created_at: string;
  reply_count: number;
}

export interface CommentReply {
  id: string;
  poll_id: string;
  user_id: string;
  parent_id: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  user_email: string;
  user_created_at: string;
}

export interface CreateCommentData {
  poll_id: string;
  content: string;
  parent_id?: string;
}

export interface CommentWithReplies extends PollComment {
  replies: CommentReply[];
}

export interface CommentStats {
  total_comments: number;
  total_replies: number;
  recent_activity: string;
}

export interface CommentFilters {
  sort_by?: 'newest' | 'oldest' | 'most_replied';
  limit?: number;
  offset?: number;
}
