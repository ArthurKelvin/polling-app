import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type MockOption = { name: string; votes: number; percentage: number };
type MockPoll = {
  id: string;
  title: string;
  totalVotes: number;
  createdAt: string;
  status: 'active' | 'closed';
  options: MockOption[];
};

export default function PollResultsPage() {
  // Mock data for demonstration - no polls
  const mockResults: MockPoll[] = [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/polls">
            <Button variant="outline" size="sm">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Poll Results</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View detailed results and analytics for your polls
        </p>
      </div>

      <div className="grid gap-8">
        {mockResults.map((poll) => (
          <Card key={poll.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{poll.title}</CardTitle>
                  <CardDescription className="mt-2">
                    Total votes: {poll.totalVotes} • Created: {poll.createdAt}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    poll.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {poll.status === 'active' ? 'Active' : 'Closed'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {poll.options.map((option, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{option.name}</span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {option.votes} votes ({option.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${option.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2 mt-6">
                <Button size="sm">
                  Export Results
                </Button>
                <Button variant="outline" size="sm">
                  Share Results
                </Button>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockResults.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No poll results available. Create some polls and gather votes to see results!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
