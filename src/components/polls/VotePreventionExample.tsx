'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useVotePrevention, 
  getVoteErrorMessage, 
  type PollStats 
} from '@/lib/vote-prevention';
import { CheckCircle, Users, AlertCircle } from 'lucide-react';

interface VotePreventionExampleProps {
  pollId: string;
  pollTitle: string;
  pollDescription?: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
  }>;
  allowUpdate?: boolean;
}

export function VotePreventionExample({
  pollId,
  pollTitle,
  pollDescription,
  options,
  allowUpdate = false
}: VotePreventionExampleProps) {
  const {
    isVoting,
    hasVoted,
    userVoteOptionId,
    error,
    vote,
    updateVote,
    clearError
  } = useVotePrevention(pollId);

  const [pollStats, setPollStats] = useState<PollStats | null>(null);

  // Load poll statistics
  useEffect(() => {
    const loadStats = async () => {
      const stats = await import('@/lib/vote-prevention').then(m => 
        m.getPollStats(pollId)
      );
      setPollStats(stats);
    };
    
    loadStats();
  }, [pollId, hasVoted]);

  const handleVote = async (optionId: string) => {
    clearError();
    
    const result = await vote(optionId, allowUpdate);
    
    if (result.success) {
      // Refresh poll stats after successful vote
      const stats = await import('@/lib/vote-prevention').then(m => 
        m.getPollStats(pollId)
      );
      setPollStats(stats);
    }
  };

  const handleUpdateVote = async (optionId: string) => {
    if (!allowUpdate) return;
    
    clearError();
    
    const result = await updateVote(optionId);
    
    if (result.success) {
      // Refresh poll stats after successful vote update
      const stats = await import('@/lib/vote-prevention').then(m => 
        m.getPollStats(pollId)
      );
      setPollStats(stats);
    }
  };

  const getTotalVotes = () => {
    return pollStats?.total_votes || options.reduce((sum, opt) => sum + opt.votes, 0);
  };

  const getOptionPercentage = (optionVotes: number) => {
    const total = getTotalVotes();
    return total > 0 ? (optionVotes / total) * 100 : 0;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl mb-2">{pollTitle}</CardTitle>
            {pollDescription && (
              <p className="text-gray-600 mb-3">{pollDescription}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {getTotalVotes()} votes
            </Badge>
            {hasVoted && (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Voted
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {getVoteErrorMessage()}
            </AlertDescription>
          </Alert>
        )}

        {/* Poll Options */}
        <div className="space-y-3">
          {options.map((option) => {
            const percentage = getOptionPercentage(option.votes);
            const isUserVotedOption = userVoteOptionId === option.id;
            const canVote = !hasVoted || (allowUpdate && hasVoted);
            
            return (
              <div key={option.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {option.text}
                    {isUserVotedOption && (
                      <Badge variant="outline" className="ml-2">
                        Your Vote
                      </Badge>
                    )}
                  </span>
                  <span className="text-sm text-gray-500">
                    {option.votes} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Progress value={percentage} className="h-2" />
                  
                  {/* Vote Button */}
                  {canVote && (
                    <Button
                      size="sm"
                      variant={isUserVotedOption ? "outline" : "default"}
                      onClick={() => {
                        if (hasVoted && allowUpdate) {
                          handleUpdateVote(option.id);
                        } else {
                          handleVote(option.id);
                        }
                      }}
                      disabled={isVoting}
                      className="w-full"
                    >
                      {isVoting ? (
                        'Processing...'
                      ) : hasVoted && allowUpdate ? (
                        isUserVotedOption ? 'Change Vote' : 'Vote for This'
                      ) : (
                        'Vote'
                      )}
                    </Button>
                  )}
                  
                  {/* Already Voted Message */}
                  {hasVoted && !allowUpdate && (
                    <p className="text-xs text-gray-500 text-center">
                      You have already voted on this poll
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Poll Statistics */}
        {pollStats && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">
              Poll Statistics
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Votes:</span>
                <span className="ml-2 font-medium">{pollStats.total_votes}</span>
              </div>
              <div>
                <span className="text-gray-600">Your Status:</span>
                <span className="ml-2 font-medium">
                  {pollStats.user_has_voted ? 'Voted' : 'Not Voted'}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Example usage component
export function VotePreventionDemo() {
  const samplePoll = {
    id: 'sample-poll-1',
    title: 'What is your favorite programming language?',
    description: 'Choose the language you enjoy working with the most.',
    options: [
      { id: 'opt-1', text: 'JavaScript/TypeScript', votes: 45 },
      { id: 'opt-2', text: 'Python', votes: 32 },
      { id: 'opt-3', text: 'Rust', votes: 18 },
      { id: 'opt-4', text: 'Go', votes: 12 }
    ]
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Vote Prevention Demo</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Standard Poll (No Updates)</h2>
          <VotePreventionExample
            pollId={samplePoll.id}
            pollTitle={samplePoll.title}
            pollDescription={samplePoll.description}
            options={samplePoll.options}
            allowUpdate={false}
          />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Flexible Poll (Allow Updates)</h2>
          <VotePreventionExample
            pollId={`${samplePoll.id}-flexible`}
            pollTitle="What is your preferred development environment?"
            pollDescription="You can change your vote if you change your mind."
            options={[
              { id: 'env-1', text: 'VS Code', votes: 67 },
              { id: 'env-2', text: 'IntelliJ IDEA', votes: 23 },
              { id: 'env-3', text: 'Vim/Neovim', votes: 15 },
              { id: 'env-4', text: 'Sublime Text', votes: 8 }
            ]}
            allowUpdate={true}
          />
        </div>
      </div>
    </div>
  );
}
