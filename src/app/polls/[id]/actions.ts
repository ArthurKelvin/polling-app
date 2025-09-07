"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/auth/server";
import { validateVoteInput, checkRateLimit } from "@/lib/validation";
import { validateCSRFToken } from "@/lib/csrf";

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
async function executeVote(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  pollId: string,
  optionId: string
): Promise<void> {
  const { error } = await supabase.rpc('cast_vote', {
    p_poll_id: pollId,
    p_option_id: optionId
  });

  if (error) {
    // Log detailed error information for debugging
    // This helps identify issues without exposing sensitive data to users
    console.error('Database vote error:', {
      pollId,
      optionId,
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    
    throw new VoteError(
      error.message || 'Failed to cast vote',
      'VOTE_FAILED',
      pollId
    );
  }
}

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
    if (csrfToken && !(await validateCSRFToken(csrfToken))) {
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
    
    // Step 5: Execute the vote
    // Uses database function with built-in validation and constraints
    await executeVote(supabase, pollId, optionId);
    
    // Step 6: Redirect on success
    // Show success message to user
    redirect(`/polls/${pollId}?voted=1`);
    
  } catch (error) {
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
