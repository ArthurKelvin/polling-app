'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function PollsPage() {
  const searchParams = useSearchParams();
  const created = searchParams.get('created') === '1';
  return (
    <div className="container mx-auto px-4 py-8">
      {created && (
        <div className="mb-6 rounded-md border border-green-300 bg-green-50 p-4 text-green-800">
          Poll created successfully.
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Polls Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create and manage your polls
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Create New Poll</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Active Polls</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              See the results and analytics of your polls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/polls/results" className="w-full">
              <Button variant="outline" className="w-full">
                View Results
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No recent activity. Create your first poll to get started!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
