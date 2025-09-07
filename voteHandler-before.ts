// Original Vote Handler Implementation - Before Optimization
// This file contains the original vote handling logic for reference

// ============================================================================
// SERVER ACTION: src/app/polls/[id]/actions.ts
// ============================================================================
"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/auth/server";

export async function voteAction(pollId: string, optionId: string) {
  const supabase = getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  try {
    // Use the cast_vote function from our database schema
    const { error } = await supabase.rpc('cast_vote', {
      p_poll_id: pollId,
      p_option_id: optionId
    });

    if (error) {
      console.error('Vote error:', error);
      // Redirect back with error message
      redirect(`/polls/${pollId}?error=${encodeURIComponent(error.message)}`);
    }

    // Success - redirect with voted=1 to show thank you message
    redirect(`/polls/${pollId}?voted=1`);
  } catch (error) {
    console.error('Vote submission error:', error);
    redirect(`/polls/${pollId}?error=Failed to submit vote`);
  }
}

// ============================================================================
// CLIENT COMPONENT: src/app/polls/[id]/vote-form.tsx
// ============================================================================
"use client";

import { useState } from "react";
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

export function VoteForm({ pollId, options }: VoteFormProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOption) return;

    setIsSubmitting(true);
    try {
      await voteAction(pollId, selectedOption);
    } catch (error) {
      console.error("Vote failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {options.map((option) => (
          <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name="vote"
              value={option.id}
              checked={selectedOption === option.id}
              onChange={(e) => setSelectedOption(e.target.value)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium">{option.label}</span>
          </label>
        ))}
      </div>
      
      <Button 
        type="submit" 
        disabled={!selectedOption || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Submitting..." : "Submit Vote"}
      </Button>
    </form>
  );
}

// ============================================================================
// DATABASE FUNCTION: supabase/migrations/0001_polls.sql (cast_vote function)
// ============================================================================
/*
create or replace function public.cast_vote(p_poll_id uuid, p_option_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_user uuid := auth.uid();
  v_option_poll uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select o.poll_id into v_option_poll from public.poll_options o where o.id = p_option_id;
  if v_option_poll is null or v_option_poll <> p_poll_id then
    raise exception 'Option does not belong to poll';
  end if;

  insert into public.votes (poll_id, option_id, user_id)
  values (p_poll_id, p_option_id, v_user)
  on conflict (poll_id, user_id) do update
    set option_id = excluded.option_id;
end;
$$;
*/

// ============================================================================
// ISSUES IDENTIFIED IN ORIGINAL IMPLEMENTATION:
// ============================================================================
/*
1. PERFORMANCE ISSUES:
   - No input validation on server side
   - No rate limiting or duplicate vote prevention
   - Generic error handling without specific error types
   - No optimistic updates for better UX
   - No caching of poll data

2. READABILITY ISSUES:
   - Mixed concerns in voteAction (auth, validation, database, redirect)
   - No clear separation of error types
   - Hard-coded redirect URLs
   - No proper TypeScript error types
   - Inconsistent error handling between client and server

3. MAINTAINABILITY ISSUES:
   - No logging strategy
   - No metrics or analytics
   - No proper error boundaries
   - No retry mechanism for failed votes
   - No audit trail for vote changes

4. SECURITY ISSUES:
   - No CSRF protection
   - No rate limiting
   - No validation of poll/option existence before voting
   - Potential for race conditions in high-traffic scenarios
*/