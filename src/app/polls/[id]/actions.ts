"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/auth/server";
import { validateVoteInput, checkRateLimit } from "@/lib/validation";
import { validateCSRFTokenAction } from "@/lib/csrf-actions";

/**
 * Custom error class for vote-related errors
 * 
 * Provides structured error handling with specific error codes
 * for better error categorization and user experience
 */
class VoteError extends Error {
  constructor(
    message: string,
    public readonly code: 'AUTH_REQUIRED' | 'INVALID_INPUT' | 'VOTE_FAILED' | 'RATE_LIMITED' | 'UNKNOWN_ERROR',
    public readonly pollId: string
  ) {
    super(message);
    this.name = 'VoteError';
  }
}

/**
 * Authentication helper function
 * 
 * Verifies that the current user is authenticated and returns user data
 * 
 * @param supabase - Supabase client instance
 * @returns Promise resolving to authenticated user object
 * @throws VoteError with AUTH_REQUIRED code if authentication fails
 */
async function ensureAuthenticated(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw new VoteError('Authentication check failed', 'AUTH_REQUIRED', '');
  }
  
  if (!user) {
    throw new VoteError('Authentication required', 'AUTH_REQUIRED', '');
  }
  
  return user;
}

/**
 * Vote execution helper function
 * 
 * Executes the actual vote using the database cast_vote function
 * This function handles the database transaction and error logging
 * 
 * @param supabase - Supabase client instance
 * @param pollId - UUID of the poll being voted on
 * @param optionId - UUID of the selected option
 * @returns Promise that resolves when vote is successfully cast
 * @throws VoteError with VOTE_FAILED code if database operation fails
 */

/**
 * Main vote action with comprehensive security and validation
 * 
 * Handles the complete voting process with multiple security layers:
 * - CSRF token validation (optional for backward compatibility)
 * - Input validation using Zod schemas
 * - User authentication verification
 * - Rate limiting to prevent abuse
 * - Database vote execution with error handling
 * 
 * @param pollId - UUID of the poll being voted on
 * @param optionId - UUID of the selected option
 * @param csrfToken - Optional CSRF token for additional security
 * @throws VoteError with specific error codes for different failure scenarios
 * @redirects to poll page with success/error indicators
 */
export async function voteAction(pollId: string, optionId: string, csrfToken?: string) {
  const supabase = await getSupabaseServerClient();

  try {
    // Step 1: Validate CSRF token if provided (optional for backward compatibility)
    // CSRF protection prevents cross-site request forgery attacks
    if (csrfToken && !(await validateCSRFTokenAction(csrfToken))) {
      throw new VoteError('Invalid CSRF token', 'INVALID_INPUT', pollId);
    }
    
    // Step 2: Validate input using zod schema
    // Ensures pollId and optionId are valid UUIDs
    validateVoteInput(pollId, optionId);
    
    // Step 3: Ensure user is authenticated
    // Only authenticated users can vote
    const user = await ensureAuthenticated(supabase);
    
    // Step 4: Check rate limiting
    // Prevents abuse by limiting votes to 5 per minute per user
    if (!checkRateLimit(user.id, 'vote')) {
      throw new VoteError('Too many votes. Please wait before voting again.', 'RATE_LIMITED', pollId);
    }
    
    // Step 5: Validate that the option belongs to the poll
    const { data: optionData, error: optionError } = await supabase
      .from('poll_options')
      .select('id, poll_id')
      .eq('id', optionId)
      .eq('poll_id', pollId)
      .single();

    if (optionError || !optionData) {
      throw new VoteError('Invalid option for this poll', 'INVALID_INPUT', pollId);
    }

    // Step 6: Execute the vote
    // Use upsert now that RLS policy is fixed
    const { error: voteError } = await supabase
      .from('votes')
      .upsert({
        poll_id: pollId,
        option_id: optionId,
        user_id: user.id,
      }, {
        onConflict: 'poll_id,user_id'
      });

    if (voteError) {
      console.error('Vote upsert error:', {
        pollId,
        optionId,
        userId: user.id,
        error: voteError.message,
        code: voteError.code,
        details: voteError.details,
        hint: voteError.hint
      });
      throw new VoteError(`Failed to record vote: ${voteError.message}`, 'VOTE_FAILED', pollId);
    }
    
    // Step 7: Redirect on success
    // Show success message to user
    redirect(`/polls/${pollId}?voted=1`);
    
  } catch (error) {
    // Handle NEXT_REDIRECT separately (this is expected behavior)
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error; // Re-throw redirect errors
    }
    
    // Handle different error types appropriately
    if (error instanceof VoteError) {
      switch (error.code) {
        case 'AUTH_REQUIRED':
          redirect("/auth/login");
          break;
        case 'INVALID_INPUT':
        case 'VOTE_FAILED':
        case 'RATE_LIMITED':
          redirect(`/polls/${error.pollId}?error=${encodeURIComponent(error.message)}`);
          break;
        default:
          redirect(`/polls/${pollId}?error=${encodeURIComponent('An unexpected error occurred')}`);
      }
    } else {
      // Handle unexpected errors
      console.error('Unexpected vote error:', error);
      redirect(`/polls/${pollId}?error=${encodeURIComponent('Failed to submit vote')}`);
    }
  }
}
