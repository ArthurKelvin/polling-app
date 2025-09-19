/**
 * Client-side Poll Operations
 * 
 * This module provides client-side functions for casting votes and retrieving poll results
 * with proper authentication, error handling, and type safety.
 */

import { getSupabaseClient } from './auth/client';
import { Poll, PollOption, PollResults, VoteData } from '@/types/poll';

// Enhanced types for better type safety
export interface VoteResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  voteId?: string;
  message?: string;
  canUpdate?: boolean;
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

export interface PollWithStats extends Poll {
  poll_options: PollOption[];
  total_votes: number;
  user_has_voted: boolean;
  user_vote_option_id?: string;
}

/**
 * Cast a vote on an existing poll
 * 
 * @param pollId - The UUID of the poll to vote on
 * @param optionId - The UUID of the option to vote for
 * @param allowUpdate - Whether to allow updating an existing vote (default: false)
 * @returns Promise<VoteResult> - Result of the vote operation
 * 
 * @example
 * ```typescript
 * const result = await castVote('poll-123', 'option-456');
 * if (result.success) {
 *   console.log('Vote cast successfully!');
 * } else {
 *   console.error('Vote failed:', result.error);
 * }
 * ```
 */
export async function castVote(
  pollId: string, 
  optionId: string, 
  allowUpdate: boolean = false
): Promise<VoteResult> {
  const supabase = getSupabaseClient();
  
  try {
    // Validate input parameters
    if (!pollId || !optionId) {
      return {
        success: false,
        error: 'Poll ID and Option ID are required',
        errorCode: 'INVALID_INPUT'
      };
    }

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return {
        success: false,
        error: 'You must be logged in to vote',
        errorCode: 'AUTH_REQUIRED'
      };
    }

    // Use the enhanced vote casting function from vote-prevention
    const { data, error } = await supabase
      .rpc('cast_vote_enhanced', {
        p_poll_id: pollId,
        p_option_id: optionId,
        p_allow_update: allowUpdate
      });

    if (error) {
      console.error('Vote casting error:', error);
      return {
        success: false,
        error: 'Failed to cast vote',
        errorCode: 'VOTE_ERROR'
      };
    }

    return data as VoteResult;

  } catch (error) {
    console.error('Unexpected error casting vote:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while voting',
      errorCode: 'UNEXPECTED_ERROR'
    };
  }
}

/**
 * Retrieve poll results with comprehensive statistics
 * 
 * @param pollId - The UUID of the poll to get results for
 * @returns Promise<PollStats | null> - Poll statistics including vote counts and user status
 * 
 * @example
 * ```typescript
 * const stats = await getPollResults('poll-123');
 * if (stats) {
 *   console.log(`Total votes: ${stats.total_votes}`);
 *   console.log(`User has voted: ${stats.user_has_voted}`);
 * }
 * ```
 */
export async function getPollResults(pollId: string): Promise<PollStats | null> {
  const supabase = getSupabaseClient();
  
  try {
    // Validate input
    if (!pollId) {
      console.error('Poll ID is required');
      return null;
    }

    // Get comprehensive poll statistics
    const { data, error } = await supabase
      .rpc('get_poll_stats', { p_poll_id: pollId });

    if (error) {
      console.error('Error fetching poll results:', error);
      return null;
    }

    return data as PollStats;

  } catch (error) {
    console.error('Unexpected error fetching poll results:', error);
    return null;
  }
}

/**
 * Get basic poll results (option labels and vote counts)
 * 
 * @param pollId - The UUID of the poll to get results for
 * @returns Promise<PollResults[]> - Array of poll results with vote counts
 * 
 * @example
 * ```typescript
 * const results = await getBasicPollResults('poll-123');
 * results.forEach(result => {
 *   console.log(`${result.label}: ${result.votes_count} votes`);
 * });
 * ```
 */
export async function getBasicPollResults(pollId: string): Promise<PollResults[]> {
  const supabase = getSupabaseClient();
  
  try {
    // Validate input
    if (!pollId) {
      console.error('Poll ID is required');
      return [];
    }

    // Get basic poll results
    const { data, error } = await supabase
      .rpc('get_poll_results', { p_poll_id: pollId });

    if (error) {
      console.error('Error fetching basic poll results:', error);
      return [];
    }

    return data as PollResults[] || [];

  } catch (error) {
    console.error('Unexpected error fetching basic poll results:', error);
    return [];
  }
}

/**
 * Check if the current user has voted on a specific poll
 * 
 * @param pollId - The UUID of the poll to check
 * @returns Promise<boolean> - True if user has voted, false otherwise
 * 
 * @example
 * ```typescript
 * const hasVoted = await checkUserVoteStatus('poll-123');
 * if (hasVoted) {
 *   console.log('User has already voted on this poll');
 * }
 * ```
 */
export async function checkUserVoteStatus(pollId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  try {
    // Validate input
    if (!pollId) {
      console.error('Poll ID is required');
      return false;
    }

    // Check if user has voted
    const { data, error } = await supabase
      .rpc('user_has_voted', { p_poll_id: pollId });

    if (error) {
      console.error('Error checking vote status:', error);
      return false;
    }

    return data || false;

  } catch (error) {
    console.error('Unexpected error checking vote status:', error);
    return false;
  }
}

/**
 * Get a complete poll with all options and statistics
 * 
 * @param pollId - The UUID of the poll to retrieve
 * @returns Promise<PollWithStats | null> - Complete poll data with statistics
 * 
 * @example
 * ```typescript
 * const poll = await getPollWithStats('poll-123');
 * if (poll) {
 *   console.log(`Poll: ${poll.question}`);
 *   console.log(`Total votes: ${poll.total_votes}`);
 *   console.log(`Options: ${poll.poll_options.length}`);
 * }
 * ```
 */
export async function getPollWithStats(pollId: string): Promise<PollWithStats | null> {
  const supabase = getSupabaseClient();
  
  try {
    // Validate input
    if (!pollId) {
      console.error('Poll ID is required');
      return null;
    }

    // Get poll with options
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .select(`
        *,
        poll_options (
          id,
          label,
          position,
          created_at
        )
      `)
      .eq('id', pollId)
      .single();

    if (pollError || !pollData) {
      console.error('Error fetching poll:', pollError);
      return null;
    }

    // Get poll statistics
    const stats = await getPollResults(pollId);
    if (!stats) {
      console.error('Error fetching poll statistics');
      return null;
    }

    return {
      ...pollData,
      poll_options: pollData.poll_options || [],
      total_votes: stats.total_votes,
      user_has_voted: stats.user_has_voted,
      user_vote_option_id: stats.user_vote_option_id
    } as PollWithStats;

  } catch (error) {
    console.error('Unexpected error fetching poll with stats:', error);
    return null;
  }
}

/**
 * Get error message for vote-related errors
 * 
 * @param errorCode - The error code from a vote operation
 * @returns string - Human-readable error message
 * 
 * @example
 * ```typescript
 * const result = await castVote('poll-123', 'option-456');
 * if (!result.success) {
 *   const message = getVoteErrorMessage(result.errorCode);
 *   console.error(message);
 * }
 * ```
 */
export function getVoteErrorMessage(errorCode?: string): string {
  switch (errorCode) {
    case 'AUTH_REQUIRED':
      return 'You must be logged in to vote.';
    case 'ALREADY_VOTED':
      return 'You have already voted on this poll.';
    case 'POLL_NOT_FOUND':
      return 'This poll does not exist or is no longer available.';
    case 'INVALID_OPTION':
      return 'The selected option is not valid for this poll.';
    case 'INVALID_INPUT':
      return 'Invalid poll ID or option ID provided.';
    case 'VOTE_ERROR':
      return 'An error occurred while processing your vote. Please try again.';
    case 'UNEXPECTED_ERROR':
      return 'An unexpected error occurred. Please try again.';
    default:
      return 'Unable to process your vote. Please try again.';
  }
}

/**
 * Validate vote data before submission
 * 
 * @param pollId - The poll ID to validate
 * @param optionId - The option ID to validate
 * @returns { valid: boolean; error?: string } - Validation result
 * 
 * @example
 * ```typescript
 * const validation = validateVoteData('poll-123', 'option-456');
 * if (!validation.valid) {
 *   console.error(validation.error);
 * }
 * ```
 */
export function validateVoteData(pollId: string, optionId: string): { valid: boolean; error?: string } {
  if (!pollId || !optionId) {
    return { valid: false, error: 'Poll ID and Option ID are required' };
  }

  // Basic UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(pollId)) {
    return { valid: false, error: 'Invalid poll ID format' };
  }

  if (!uuidRegex.test(optionId)) {
    return { valid: false, error: 'Invalid option ID format' };
  }

  return { valid: true };
}
