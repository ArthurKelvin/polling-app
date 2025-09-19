"use server";

import { getSupabaseServerClient } from '@/lib/auth/server';
import type { PollComment, CommentReply, CreateCommentData, CommentWithReplies, CommentStats } from '@/types/comment';

/**
 * Comments service for handling poll comments and discussions
 */

/**
 * Get comments for a poll
 */
export async function getPollComments(
  pollId: string, 
  limit: number = 50, 
  offset: number = 0
): Promise<{ success: boolean; comments?: PollComment[]; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .rpc('get_poll_comments', {
        poll_uuid: pollId,
        limit_count: limit,
        offset_count: offset
      });

    if (error) {
      console.error('Error getting poll comments:', error);
      return { success: false, error: error.message };
    }

    return { success: true, comments: data || [] };
  } catch (error) {
    console.error('Unexpected error getting poll comments:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get replies for a comment
 */
export async function getCommentReplies(commentId: string): Promise<{ success: boolean; replies?: CommentReply[]; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .rpc('get_comment_replies', {
        comment_uuid: commentId
      });

    if (error) {
      console.error('Error getting comment replies:', error);
      return { success: false, error: error.message };
    }

    return { success: true, replies: data || [] };
  } catch (error) {
    console.error('Unexpected error getting comment replies:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Create a new comment
 */
export async function createComment(
  userId: string,
  commentData: CreateCommentData
): Promise<{ success: boolean; comment?: PollComment; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('poll_comments')
      .insert({
        poll_id: commentData.poll_id,
        user_id: userId,
        parent_id: commentData.parent_id || null,
        content: commentData.content.trim()
      })
      .select(`
        id,
        poll_id,
        user_id,
        parent_id,
        content,
        is_deleted,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return { success: false, error: error.message };
    }

    // Get user email for the response
    const { data: userData } = await supabase
      .from('auth.users')
      .select('email, created_at')
      .eq('id', userId)
      .single();

    const comment: PollComment = {
      ...data,
      user_email: userData?.email || 'Unknown',
      user_created_at: userData?.created_at || new Date().toISOString(),
      reply_count: 0
    };

    return { success: true, comment };
  } catch (error) {
    console.error('Unexpected error creating comment:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update a comment
 */
export async function updateComment(
  commentId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    
    // Check if user owns the comment
    const { data: comment, error: fetchError } = await supabase
      .from('poll_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return { success: false, error: 'Comment not found' };
    }

    if (comment.user_id !== userId) {
      return { success: false, error: 'You can only edit your own comments' };
    }

    const { error } = await supabase
      .from('poll_comments')
      .update({ 
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId);

    if (error) {
      console.error('Error updating comment:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating comment:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Delete a comment (soft delete)
 */
export async function deleteComment(
  commentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .rpc('soft_delete_comment', {
        comment_uuid: commentId,
        user_uuid: userId
      });

    if (error) {
      console.error('Error deleting comment:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'You do not have permission to delete this comment' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting comment:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get comment count for a poll
 */
export async function getPollCommentCount(pollId: string): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    
    const { data, error } = await supabase
      .rpc('get_poll_comment_count', {
        poll_uuid: pollId
      });

    if (error) {
      console.error('Error getting comment count:', error);
      return { success: false, error: error.message };
    }

    return { success: true, count: data || 0 };
  } catch (error) {
    console.error('Unexpected error getting comment count:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get comments with replies for a poll
 */
export async function getPollCommentsWithReplies(
  pollId: string,
  limit: number = 20
): Promise<{ success: boolean; comments?: CommentWithReplies[]; error?: string }> {
  try {
    // Get main comments
    const commentsResult = await getPollComments(pollId, limit, 0);
    if (!commentsResult.success || !commentsResult.comments) {
      return commentsResult;
    }

    // Get replies for each comment
    const commentsWithReplies: CommentWithReplies[] = [];
    
    for (const comment of commentsResult.comments) {
      const repliesResult = await getCommentReplies(comment.id);
      commentsWithReplies.push({
        ...comment,
        replies: repliesResult.replies || []
      });
    }

    return { success: true, comments: commentsWithReplies };
  } catch (error) {
    console.error('Unexpected error getting comments with replies:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
