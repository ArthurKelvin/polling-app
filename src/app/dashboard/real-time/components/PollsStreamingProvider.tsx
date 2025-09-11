'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PollsList } from './PollsList';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Poll {
  id: string;
  title: string;
  description?: string;
  total_votes: number;
  created_at: string;
  poll_options: {
    id: string;
    text: string;
    votes: number;
  }[];
}

interface PollsStreamingProviderProps {
  initialPolls: Poll[];
}

export function PollsStreamingProvider({ initialPolls }: PollsStreamingProviderProps) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const supabase = createClient();

  // Update poll data when receiving real-time updates
  const handlePollUpdate = useCallback((payload: any) => {
    console.log('Received poll update:', payload);
    
    setPolls(prevPolls => {
      const updatedPolls = [...prevPolls];
      const pollIndex = updatedPolls.findIndex(poll => poll.id === payload.new.poll_id);
      
      if (pollIndex !== -1) {
        // Update the specific poll option
        const optionIndex = updatedPolls[pollIndex].poll_options.findIndex(
          option => option.id === payload.new.id
        );
        
        if (optionIndex !== -1) {
          updatedPolls[pollIndex].poll_options[optionIndex] = {
            ...updatedPolls[pollIndex].poll_options[optionIndex],
            votes: payload.new.votes
          };
        }
      }
      
      return updatedPolls;
    });
  }, []);

  const handlePollVoteUpdate = useCallback((payload: any) => {
    console.log('Received vote update:', payload);
    
    setPolls(prevPolls => {
      const updatedPolls = [...prevPolls];
      const pollIndex = updatedPolls.findIndex(poll => poll.id === payload.new.poll_id);
      
      if (pollIndex !== -1) {
        // Update total votes for the poll
        updatedPolls[pollIndex].total_votes = payload.new.total_votes;
      }
      
      return updatedPolls;
    });
  }, []);

  useEffect(() => {
    // Subscribe to real-time updates
    const pollOptionsChannel = supabase
      .channel('poll_options_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'poll_options',
        },
        handlePollUpdate
      )
      .subscribe((status) => {
        console.log('Poll options channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    const pollsChannel = supabase
      .channel('polls_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'polls',
        },
        handlePollVoteUpdate
      )
      .subscribe((status) => {
        console.log('Polls channel status:', status);
      });

    setChannel(pollOptionsChannel);

    return () => {
      pollOptionsChannel.unsubscribe();
      pollsChannel.unsubscribe();
    };
  }, [supabase, handlePollUpdate, handlePollVoteUpdate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Live Polls</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      
      <PollsList polls={polls} />
    </div>
  );
}
