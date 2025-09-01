import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PollsListPage() {
  // Mock data for demonstration
  const mockPolls = [
    {
      id: 1,
      title: "What's your favorite programming language?",
      description: "Choose from popular programming languages",
      totalVotes: 156,
      status: "active",
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      title: "Best framework for web development?",
      description: "Vote for your preferred web framework",
      totalVotes: 89,
      status: "active",
      createdAt: "2024-01-10"
    },
    {
      id: 3,
      title: "Preferred database system",
      description: "Which database do you use most?",
      totalVotes: 234,
      status: "closed",
      createdAt: "2024-01-05"
    }
  ];

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Active Polls</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View and manage your polls
        </p>
      </div>

      <div className="grid gap-6">
        {mockPolls.map((poll) => (
          <Card key={poll.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{poll.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {poll.description}
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
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Total votes: {poll.totalVotes}</span>
                <span>Created: {poll.createdAt}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm">
                  View Details
                </Button>
                {poll.status === 'active' && (
                  <Button variant="outline" size="sm">
                    Edit Poll
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  View Results
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockPolls.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No polls found. Create your first poll to get started!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
