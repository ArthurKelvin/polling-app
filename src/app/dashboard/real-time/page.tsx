import { Suspense } from 'react';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { PollsList } from './components/PollsList';
import { CreatePollForm } from './components/CreatePollForm';
import { RealTimeStats } from './components/RealTimeStats';
import { PollsStreamingProvider } from './components/PollsStreamingProvider';

// React 19 native metadata support
export const metadata: Metadata = {
  title: 'Real-time Polling Dashboard',
  description: 'Live polling dashboard with real-time updates',
  keywords: ['polls', 'real-time', 'dashboard', 'voting'],
  openGraph: {
    title: 'Real-time Polling Dashboard',
    description: 'Live polling dashboard with real-time updates',
    type: 'website',
  },
};

// Server Component - fetches initial data
async function DashboardContent() {
  const supabase = createClient();
  
  // Fetch polls data on the server
  const { data: polls, error } = await supabase
    .from('polls')
    .select(`
      *,
      poll_options (
        id,
        text,
        votes
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch polls');
  }

  // Create a promise for real-time stats (not awaited - will stream)
  const statsPromise = supabase
    .from('polls')
    .select('id, total_votes')
    .then(({ data }) => ({
      totalPolls: data?.length || 0,
      totalVotes: data?.reduce((sum, poll) => sum + (poll.total_votes || 0), 0) || 0,
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* React 19 native metadata in component */}
      <title>Real-time Polling Dashboard</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Real-time Polling Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Live updates powered by React 19 Server Components
          </p>
        </header>

        {/* Real-time stats with streaming */}
        <Suspense fallback={<StatsSkeleton />}>
          <RealTimeStats statsPromise={statsPromise} />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Create Poll Form */}
          <div className="lg:col-span-1">
            <CreatePollForm />
          </div>

          {/* Polls List with streaming */}
          <div className="lg:col-span-2">
            <PollsStreamingProvider initialPolls={polls} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

export default function RealTimeDashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
