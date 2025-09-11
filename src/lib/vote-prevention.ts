/**
 * Vote Prevention Utilities
 * 
 * This module provides utilities for preventing multiple votes per user per poll
 * using the enhanced database schema with multiple layers of protection.
 */

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';

export interface VoteResult {
  success: boolean;
  error?: string;
  error_code?: string;
  vote_id?: string;
  message?: string;
  can_update?: boolean;
}

export interface PollStats {
  poll_id: string;
  total_votes: number;
  user_has_voted: boolean;
  user_vote_option_id?: string;
  options: Array<{
    option_id: string;
    label: string;
    votes: number;
    user_voted_for_this: boolean;
  }>;
}

/**
 * Check if the current user has already voted on a specific poll
 */
export async function checkUserVoteStatus(pollId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('user_has_voted', { p_poll_id: pollId });
  
  if (error) {
    console.error('Error checking vote status:', error);
    return false;
  }
  
  return data || false;
}

/**
 * Cast a vote with comprehensive validation and duplicate prevention
 */
export async function castVote(
  pollId: string, 
  optionId: string, 
  allowUpdate: boolean = false
): Promise<VoteResult> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('cast_vote_enhanced', {
      p_poll_id: pollId,
      p_option_id: optionId,
      p_allow_update: allowUpdate
    });
  
  if (error) {
    console.error('Error casting vote:', error);
    return {
      success: false,
      error: 'Failed to cast vote',
      error_code: 'VOTE_ERROR'
    };
  }
  
  return data as VoteResult;
}

/**
 * Get comprehensive poll statistics including user vote status
 */
export async function getPollStats(pollId: string): Promise<PollStats | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('get_poll_stats', { p_poll_id: pollId });
  
  if (error) {
    console.error('Error getting poll stats:', error);
    return null;
  }
  
  return data as PollStats;
}

/**
 * Get the current user's vote for a specific poll
 */
export async function getUserVote(pollId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .rpc('get_user_vote', { p_poll_id: pollId });
  
  if (error) {
    console.error('Error getting user vote:', error);
    return null;
  }
  
  return data;
}

/**
 * React hook for managing vote state with duplicate prevention
 */
export function useVotePrevention(pollId: string) {
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVoteOptionId, setUserVoteOptionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check vote status on mount
  useEffect(() => {
    checkUserVoteStatus(pollId).then(setHasVoted);
    getPollStats(pollId).then(stats => {
      if (stats) {
        setUserVoteOptionId(stats.user_vote_option_id || null);
      }
    });
  }, [pollId]);

  const vote = async (optionId: string, allowUpdate: boolean = false) => {
    if (isVoting) return;
    
    setIsVoting(true);
    setError(null);
    
    try {
      const result = await castVote(pollId, optionId, allowUpdate);
      
      if (result.success) {
        setHasVoted(true);
        setUserVoteOptionId(optionId);
        return result;
      } else {
        setError(result.error || 'Failed to vote');
        return result;
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsVoting(false);
    }
  };

  const updateVote = async (optionId: string) => {
    return vote(optionId, true);
  };

  return {
    isVoting,
    hasVoted,
    userVoteOptionId,
    error,
    vote,
    updateVote,
    clearError: () => setError(null)
  };
}

/**
 * Error message mapping for better UX
 */
export function getVoteErrorMessage(errorCode?: string): string {
  switch (errorCode) {
    case 'ALREADY_VOTED':
      return 'You have already voted on this poll. You can update your vote if allowed.';
    case 'AUTH_REQUIRED':
      return 'You must be logged in to vote.';
    case 'POLL_NOT_FOUND':
      return 'This poll does not exist or is no longer available.';
    case 'INVALID_OPTION':
      return 'The selected option is not valid for this poll.';
    case 'VOTE_ERROR':
      return 'An error occurred while processing your vote. Please try again.';
    default:
      return 'Unable to process your vote. Please try again.';
  }
}

/**
 * Validation helper for vote operations
 */
export function validateVoteOperation(
  pollId: string, 
  optionId: string, 
  hasVoted: boolean, 
  allowUpdate: boolean = false
): { valid: boolean; error?: string } {
  if (!pollId || !optionId) {
    return { valid: false, error: 'Poll ID and Option ID are required' };
  }
  
  if (hasVoted && !allowUpdate) {
    return { valid: false, error: 'You have already voted on this poll' };
  }
  
  return { valid: true };
}
