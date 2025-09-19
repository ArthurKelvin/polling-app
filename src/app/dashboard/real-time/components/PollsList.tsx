'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { voteAction } from '../actions';
import { CheckCircle, Users, Clock } from 'lucide-react';

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

interface PollsListProps {
  polls: Poll[];
}

export function PollsList({ polls }: PollsListProps) {
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const handleVote = async (pollId: string, optionId: string) => {
    if (votedPolls.has(pollId)) {
      return;
    }

    startTransition(async () => {
      const result = await voteAction(pollId, optionId);
      
      if (result.success) {
        setVotedPolls(prev => new Set([...prev, pollId]));
      } else {
        // Handle error (you might want to show a toast notification)
        console.error('Vote failed:', result.error);
      }
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (polls.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No polls yet</h3>
          <p className="text-gray-600 text-center">
            Create your first poll to get started with real-time voting!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {polls.map((poll) => {
        const hasVoted = votedPolls.has(poll.id);
        const totalVotes = poll.total_votes;

        return (
          <Card key={poll.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{poll.title}</CardTitle>
                  {poll.description && (
                    <p className="text-gray-600 mb-3">{poll.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  {formatDate(poll.created_at)}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {totalVotes} votes
                </Badge>
                {hasVoted && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Voted
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {poll.poll_options.map((option) => {
                  const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                  
                  return (
                    <div key={option.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          {option.text}
                        </span>
                        <span className="text-sm text-gray-500">
                          {option.votes} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <Progress 
                          value={percentage} 
                          className="h-2"
                        />
                        
                        {!hasVoted && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVote(poll.id, option.id)}
                            disabled={isPending}
                            className="w-full"
                          >
                            {isPending ? 'Voting...' : 'Vote'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
