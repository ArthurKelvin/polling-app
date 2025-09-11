'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Clock, 
  Plus, 
  Eye, 
  Activity,
  Zap
} from 'lucide-react';

interface PollsDashboardProps {
  polls: Array<{
    id: string;
    question: string;
    totalVotes: number;
    createdAt: string;
    isActive: boolean;
  }>;
  analytics: Array<{
    pollId: string;
    totalVotes: number;
    recentVotes: number;
    topOption: string;
    isActive: boolean;
  }>;
  recentActivity: Array<{
    type: string;
    pollId: string;
    question: string;
    timestamp: string;
    votes: number;
  }>;
  isAuthenticated: boolean;
  isLoading?: boolean;
  error?: string;
}

export function PollsDashboard({ 
  polls, 
  analytics, 
  recentActivity, 
  isAuthenticated,
  isLoading = false,
  error
}: PollsDashboardProps) {
  const totalPolls = polls.length;
  const totalVotes = polls.reduce((sum, poll) => sum + poll.totalVotes, 0);
  const activePolls = polls.filter(poll => poll.isActive).length;
  const recentVotes = analytics.reduce((sum, stat) => sum + stat.recentVotes, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'poll_created':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'vote_cast':
        return <Users className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to Polls Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Sign in to create and manage your polls with real-time analytics
          </p>
        </div>
        <div className="space-x-4">
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="outline">Sign Up</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPolls}</div>
            <p className="text-xs text-muted-foreground">
              {totalPolls === 0 ? 'No polls created yet' : 'Polls created'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVotes}</div>
            <p className="text-xs text-muted-foreground">
              {totalVotes === 0 ? 'No votes yet' : 'Votes received'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Polls</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePolls}</div>
            <p className="text-xs text-muted-foreground">
              {activePolls === 0 ? 'No active polls' : 'Polls with votes'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentVotes}</div>
            <p className="text-xs text-muted-foreground">
              Votes in last 5 minutes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Poll
            </CardTitle>
            <CardDescription>
              Start a new poll to gather opinions from your audience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/polls/create" className="w-full">
              <Button className="w-full">
                Create Poll
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Manage Polls
            </CardTitle>
            <CardDescription>
              View and manage your currently active polls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/polls/list" className="w-full">
              <Button variant="outline" className="w-full">
                View Polls
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </CardTitle>
            <CardDescription>
              See detailed results and analytics of your polls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/polls/results" className="w-full">
              <Button variant="outline" className="w-full">
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Polls */}
      {polls.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Polls
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {polls.slice(0, 6).map((poll) => {
              const pollAnalytics = analytics.find(a => a.pollId === poll.id);
              return (
                <Card key={poll.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">
                        {poll.question}
                      </CardTitle>
                      <Badge variant={poll.isActive ? "default" : "secondary"}>
                        {poll.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Created {formatDate(poll.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Votes:</span>
                        <span className="font-medium">{poll.totalVotes}</span>
                      </div>
                      {pollAnalytics && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Recent Votes:</span>
                          <span className="font-medium text-green-600">
                            {pollAnalytics.recentVotes}
                          </span>
                        </div>
                      )}
                      {pollAnalytics?.topOption && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Top Option:</span>
                          <span className="font-medium truncate max-w-[200px]">
                            {pollAnalytics.topOption}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Link href={`/polls/${poll.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Poll
                        </Button>
                      </Link>
                      <Link href={`/polls/results?poll=${poll.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Analytics
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <Card>
          <CardContent className="pt-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {activity.type === 'poll_created' ? 'Poll created' : 'Vote cast'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {activity.question}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(activity.timestamp)}
                      </p>
                      {activity.votes > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {activity.votes} votes
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No recent activity. Create your first poll to get started!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
