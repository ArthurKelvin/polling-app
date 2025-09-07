"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/auth/server";
import { validateVoteInput, checkRateLimit } from "@/lib/validation";
import { validateCSRFToken } from "@/lib/csrf";

// Custom error types for better error handling
export class VoteError extends Error {
  constructor(
    message: string,
    public readonly code: 'AUTH_REQUIRED' | 'INVALID_INPUT' | 'VOTE_FAILED' | 'RATE_LIMITED' | 'UNKNOWN_ERROR',
    public readonly pollId: string
  ) {
    super(message);
    this.name = 'VoteError';
  }
}

// Authentication helper
async function ensureAuthenticated(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    throw new VoteError('Authentication check failed', 'AUTH_REQUIRED', '');
  }
  
  if (!user) {
    throw new VoteError('Authentication required', 'AUTH_REQUIRED', '');
  }
  
  return user;
}

// Vote execution helper
async function executeVote(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  pollId: string,
  optionId: string
): Promise<void> {
  const { error } = await supabase.rpc('cast_vote', {
    p_poll_id: pollId,
    p_option_id: optionId
  });

  if (error) {
    // Log the error for debugging
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

// Main vote action with improved error handling and validation
export async function voteAction(pollId: string, optionId: string, csrfToken?: string) {
  const supabase = getSupabaseServerClient();

  try {
    // Step 1: Validate CSRF token if provided (optional for backward compatibility)
    if (csrfToken && !(await validateCSRFToken(csrfToken))) {
      throw new VoteError('Invalid CSRF token', 'INVALID_INPUT', pollId);
    }
    
    // Step 2: Validate input using zod schema
    validateVoteInput(pollId, optionId);
    
    // Step 3: Ensure user is authenticated
    const user = await ensureAuthenticated(supabase);
    
    // Step 4: Check rate limiting
    if (!checkRateLimit(user.id, 'vote')) {
      throw new VoteError('Too many votes. Please wait before voting again.', 'RATE_LIMITED', pollId);
    }
    
    // Step 5: Execute the vote
    await executeVote(supabase, pollId, optionId);
    
    // Step 6: Redirect on success
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
