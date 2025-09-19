"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/provider';
import { useRoles } from '@/lib/auth/use-roles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Reply, 
  Edit, 
  Trash2, 
  MoreVertical,
  User,
  Clock,
  AlertCircle
} from 'lucide-react';
import type { PollComment, CommentReply, CreateCommentData } from '@/types/comment';

interface PollCommentsProps {
  pollId: string;
  pollTitle: string;
}

interface CommentItemProps {
  comment: PollComment;
  replies: CommentReply[];
  onReply: (parentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  currentUserId?: string;
  canModerate: boolean;
}

function CommentItem({ 
  comment, 
  replies, 
  onReply, 
  onEdit, 
  onDelete, 
  currentUserId, 
  canModerate 
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentUserId === comment.user_id;
  const canEdit = isOwner;
  const canDelete = isOwner || canModerate;

  const handleEdit = async () => {
    if (editContent.trim() === comment.content) {
      setIsEditing(false);
      return;
    }

    try {
      const response = await fetch('/api/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId: comment.id,
          content: editContent.trim()
        })
      });

      if (response.ok) {
        setIsEditing(false);
        // Refresh comments
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: comment.id })
      });

      if (response.ok) {
        // Refresh comments
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border-l-2 border-gray-200 pl-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-sm">{comment.user_email}</span>
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">
              {new Date(comment.created_at).toLocaleString()}
            </span>
            {comment.updated_at !== comment.created_at && (
              <Badge variant="outline" className="text-xs">
                edited
              </Badge>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[80px]"
                placeholder="Edit your comment..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit}>
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
          )}
        </div>

        {(canEdit || canDelete) && !isEditing && (
          <div className="flex gap-1 ml-2">
            {canEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mt-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onReply(comment.id)}
          className="text-blue-600 hover:text-blue-700"
        >
          <Reply className="h-3 w-3 mr-1" />
          Reply
        </Button>
        
        {comment.reply_count > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowReplies(!showReplies)}
            className="text-gray-600"
          >
            {showReplies ? 'Hide' : 'Show'} {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
          </Button>
        )}
      </div>

      {showReplies && replies.length > 0 && (
        <div className="mt-4 space-y-3">
          {replies.map((reply) => (
            <div key={reply.id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-3 w-3 text-gray-500" />
                <span className="font-medium text-xs">{reply.user_email}</span>
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {new Date(reply.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PollComments({ pollId, pollTitle }: PollCommentsProps) {
  const { user } = useAuth();
  const { canModerate } = useRoles();
  const [comments, setComments] = useState<PollComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch comments
  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/comments?pollId=${pollId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  };

  // Submit new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId,
          content: newComment.trim()
        })
      });

      if (response.ok) {
        setNewComment('');
        fetchComments();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to post comment');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit reply
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !user || !replyingTo) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId,
          content: replyContent.trim(),
          parentId: replyingTo
        })
      });

      if (response.ok) {
        setReplyContent('');
        setReplyingTo(null);
        fetchComments();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to post reply');
      }
    } catch (err) {
      console.error('Error posting reply:', err);
      setError('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch comments on mount
  useEffect(() => {
    fetchComments();
  }, [pollId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading comments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Discussion ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* New Comment Form */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Share your thoughts on "${pollTitle}"...`}
                className="min-h-[100px]"
                required
              />
            </div>
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={submitting || !newComment.trim()}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p>Please sign in to join the discussion.</p>
          </div>
        )}

        {/* Reply Form */}
        {replyingTo && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Reply to comment</h4>
            <form onSubmit={handleSubmitReply} className="space-y-3">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                className="min-h-[80px]"
                required
              />
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={submitting || !replyContent.trim()}
                >
                  {submitting ? 'Posting...' : 'Post Reply'}
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No comments yet. Be the first to start the discussion!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={[]} // TODO: Implement replies fetching
                onReply={setReplyingTo}
                onEdit={() => {}} // TODO: Implement edit
                onDelete={() => {}} // TODO: Implement delete
                currentUserId={user?.id}
                canModerate={canModerate()}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
