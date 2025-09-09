
"use client";

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/auth/client';
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PollResultsProps {
  pollId: string;
}

interface PollResult {
  label: string;
  votes: number;
}

export function PollResults({ pollId }: PollResultsProps) {
  const [results, setResults] = useState<PollResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  const fetchResults = async () => {
    const { data, error } = await supabase.rpc('get_poll_results', { p_poll_id: pollId });

    if (error) {
      setError('Failed to fetch results. Please try again.');
      console.error('Error fetching poll results:', error);
      setResults([]);
    } else {
      setResults(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResults();

    const channel = supabase
      .channel(`poll-results-${pollId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'poll_votes', filter: `poll_id=eq.${pollId}` },
        (payload) => {
          // Re-fetch results when a new vote is inserted
          fetchResults();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollId]);

  if (loading) {
    return <div>Loading results...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (results.length === 0) {
    return <div>No votes have been cast yet.</div>;
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <BarChart data={results} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <XAxis dataKey="label" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="votes" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
