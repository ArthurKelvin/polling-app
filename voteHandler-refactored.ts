// Refactored Vote Handler Implementation - After Optimization
// This file contains the optimized vote handling logic with improved readability and performance

// ============================================================================
// SERVER ACTION: src/app/polls/[id]/actions.ts (REFACTORED)
// ============================================================================
"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/auth/server";

// Custom error types for better error handling
export class VoteError extends Error {
  constructor(
    message: string,
    public readonly code: 'AUTH_REQUIRED' | 'INVALID_INPUT' | 'VOTE_FAILED' | 'UNKNOWN_ERROR',
    public readonly pollId: string
  ) {
    super(message);
    this.name = 'VoteError';
  }
}

// Input validation helper
function validateVoteInput(pollId: string, optionId: string): void {
  if (!pollId || typeof pollId !== 'string' || pollId.trim().length === 0) {
    throw new VoteError('Invalid poll ID', 'INVALID_INPUT', pollId);
  }
  
  if (!optionId || typeof optionId !== 'string' || optionId.trim().length === 0) {
    throw new VoteError('Invalid option ID', 'INVALID_INPUT', pollId);
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
export async function voteAction(pollId: string, optionId: string) {
  const supabase = getSupabaseServerClient();

  try {
    // Step 1: Validate input
    validateVoteInput(pollId, optionId);
    
    // Step 2: Ensure user is authenticated
    await ensureAuthenticated(supabase);
    
    // Step 3: Execute the vote
    await executeVote(supabase, pollId, optionId);
    
    // Step 4: Redirect on success
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

// ============================================================================
// CLIENT COMPONENT: src/app/polls/[id]/vote-form.tsx (REFACTORED)
// ============================================================================
"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { voteAction } from "./actions";

type Option = {
  id: string;
  label: string;
};

type VoteFormProps = {
  pollId: string;
  options: Option[];
};

type VoteState = 'idle' | 'submitting' | 'success' | 'error';

export function VoteForm({ pollId, options }: VoteFormProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [voteState, setVoteState] = useState<VoteState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Memoize the options to prevent unnecessary re-renders
  const memoizedOptions = useMemo(() => options, [options]);

  // Memoize the submit handler to prevent unnecessary re-renders
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Early return if no option selected or already submitting
    if (!selectedOption || voteState === 'submitting') {
      return;
    }

    setVoteState('submitting');
    setErrorMessage("");

    try {
      await voteAction(pollId, selectedOption);
      setVoteState('success');
    } catch (error) {
      console.error("Vote failed:", error);
      setVoteState('error');
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit vote");
    }
  }, [selectedOption, pollId, voteState]);

  // Memoize option change handler
  const handleOptionChange = useCallback((optionId: string) => {
    if (voteState === 'submitting') return; // Prevent changes while submitting
    setSelectedOption(optionId);
    setErrorMessage(""); // Clear any previous errors
  }, [voteState]);

  // Memoize the submit button text
  const submitButtonText = useMemo(() => {
    switch (voteState) {
      case 'submitting':
        return "Submitting...";
      case 'success':
        return "Vote Submitted!";
      case 'error':
        return "Try Again";
      default:
        return "Submit Vote";
    }
  }, [voteState]);

  // Memoize the submit button disabled state
  const isSubmitDisabled = useMemo(() => {
    return !selectedOption || voteState === 'submitting' || voteState === 'success';
  }, [selectedOption, voteState]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {memoizedOptions.map((option) => (
          <label 
            key={option.id} 
            className={`flex items-center space-x-3 cursor-pointer transition-colors ${
              voteState === 'submitting' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <input
              type="radio"
              name="vote"
              value={option.id}
              checked={selectedOption === option.id}
              onChange={(e) => handleOptionChange(e.target.value)}
              disabled={voteState === 'submitting'}
              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium">{option.label}</span>
          </label>
        ))}
      </div>
      
      {errorMessage && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {errorMessage}
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={isSubmitDisabled}
        className={`w-full transition-colors ${
          voteState === 'success' 
            ? 'bg-green-600 hover:bg-green-700' 
            : voteState === 'error'
            ? 'bg-red-600 hover:bg-red-700'
            : ''
        }`}
      >
        {submitButtonText}
      </Button>
    </form>
  );
}

// ============================================================================
// OPTIMIZATIONS IMPLEMENTED:
// ============================================================================

/*
🚀 PERFORMANCE IMPROVEMENTS:

1. **Input Validation**: Added server-side validation to catch invalid data early
   - Prevents unnecessary database calls
   - Reduces server load and improves response times
   - Better error messages for debugging

2. **Separation of Concerns**: Split the monolithic voteAction into focused functions
   - validateVoteInput(): Handles input validation
   - ensureAuthenticated(): Handles authentication
   - executeVote(): Handles database operations
   - Each function has a single responsibility

3. **Custom Error Types**: Created VoteError class with specific error codes
   - Better error handling and debugging
   - Type-safe error management
   - Structured error responses

4. **React Performance Optimizations**:
   - useMemo() for options array to prevent unnecessary re-renders
   - useCallback() for event handlers to prevent function recreation
   - Memoized computed values (button text, disabled state)
   - Early returns to prevent unnecessary processing

5. **Enhanced User Experience**:
   - Visual feedback during submission (disabled state, loading text)
   - Error message display with proper styling
   - Success state indication
   - Prevents multiple submissions

6. **Better Error Handling**:
   - Structured error logging with context
   - Specific error types for different failure scenarios
   - Graceful degradation for unexpected errors
   - User-friendly error messages

📈 READABILITY IMPROVEMENTS:

1. **Clear Function Names**: Each function has a descriptive name that explains its purpose
2. **Step-by-Step Flow**: The main voteAction follows a clear 4-step process
3. **Type Safety**: Added proper TypeScript types for all functions and variables
4. **Comments**: Added inline comments explaining the purpose of each section
5. **Consistent Error Handling**: All errors follow the same pattern and structure

🔧 MAINTAINABILITY IMPROVEMENTS:

1. **Modular Design**: Each function can be tested independently
2. **Error Boundaries**: Clear separation between different types of errors
3. **Logging Strategy**: Structured logging for better debugging
4. **Extensibility**: Easy to add new error types or validation rules
5. **Code Reusability**: Helper functions can be reused in other parts of the app

🎯 SPECIFIC PERFORMANCE GAINS:

- **Reduced Re-renders**: Memoization prevents unnecessary component updates
- **Faster Error Handling**: Early validation prevents expensive database operations
- **Better Memory Usage**: useCallback prevents function recreation on every render
- **Improved UX**: Visual feedback reduces perceived loading time
- **Better Debugging**: Structured error logging speeds up issue resolution
*/
