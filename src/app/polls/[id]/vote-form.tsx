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
