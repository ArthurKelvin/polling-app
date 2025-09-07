"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { voteAction } from "./actions"
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
  const [csrfToken, setCsrfToken] = useState<string>("");

  // Generate CSRF token on component mount
  useEffect(() => {
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCsrfToken(data.token))
      .catch(() => setCsrfToken('')); // Fallback for development
  }, []);

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
      await voteAction(pollId, selectedOption, csrfToken);
      setVoteState('success');
    } catch (error) {
      console.error("Vote failed:", error);
      setVoteState('error');
      setErrorMessage(error instanceof Error ? error.message : "Failed to submit vote");
    }
  }, [selectedOption, pollId, voteState, csrfToken]);

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
      <input type="hidden" name="csrf_token" value={csrfToken} />
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
