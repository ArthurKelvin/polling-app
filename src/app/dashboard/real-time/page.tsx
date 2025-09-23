import { Suspense } from 'react';
import { Metadata } from 'next';
import { getSupabaseServerClient } from '@/lib/auth/server';
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
  const supabase = await getSupabaseServerClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error('Auth error in dashboard:', authError);
    throw new Error(`Authentication error: ${authError.message}`);
  }
  
  if (!user) {
    throw new Error('User must be authenticated to access dashboard');
  }

  // Check user role
  const { data: userRole, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const isAdmin = userRole?.role === 'admin';
  
  // Fetch polls data on the server
  const { data: polls, error } = await supabase
    .from('polls')
    .select(`
      *,
      poll_options (
        id,
        label,
        votes
      )
    `)
    .eq('owner_id', user.id) // Only fetch user's own polls
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Dashboard polls fetch error:', error);
    // Instead of throwing, return empty polls array to prevent crash
    console.warn('Falling back to empty polls array due to fetch error');
  }

  const pollsData = polls || [];

  // Create a promise for real-time stats (not awaited - will stream)
  const statsPromise: Promise<{ totalPolls: number; totalVotes: number }> = (async () => {
    const { data } = await supabase
      .from('polls')
      .select('id, total_votes')
      .eq('owner_id', user.id);
    return {
      totalPolls: data?.length || 0,
      totalVotes: data?.reduce((sum: number, poll: { total_votes: number }) => sum + (poll.total_votes || 0), 0) || 0,
    };
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* React 19 native metadata in component */}
      <title>Real-time Polling Dashboard</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-gray-900">
              Real-time Polling Dashboard
            </h1>
            {isAdmin && (
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                🔑 ADMIN
              </div>
            )}
          </div>
          <p className="text-lg text-gray-600">
            Live updates powered by React 19 Server Components
            {isAdmin && (
              <span className="ml-2 text-sm text-red-600 font-medium">
                (Admin privileges active)
              </span>
            )}
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
            <PollsStreamingProvider initialPolls={pollsData} />
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
