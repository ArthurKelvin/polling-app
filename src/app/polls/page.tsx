
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCurrentUser } from '@/lib/auth/actions';
import { getUserPollAnalytics, getRealTimeStats } from '@/lib/analytics';
import { PollsDashboard } from '@/components/polls/PollsDashboard';

interface PollSummary {
  id: string;
  question: string;
  totalVotes: number;
  createdAt: string;
  isActive: boolean;
}

export default async function PollsPage() {
  const supabase = await getSupabaseServerClient();
  const user = await getCurrentUser(supabase);

  let polls: PollSummary[] = [];
  let analytics: any[] = [];
  let recentActivity: any[] = [];

  if (user) {
    try {
      // Get user's polls
      const { data: userPolls, error: pollsError } = await supabase
        .from("polls")
        .select(`
          id,
          question,
          created_at,
          votes:votes(count)
        `)
        .eq("owner_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!pollsError && userPolls) {
        polls = userPolls.map(poll => ({
          id: poll.id,
          question: poll.question,
          totalVotes: poll.votes?.[0]?.count || 0,
          createdAt: poll.created_at,
          isActive: (poll.votes?.[0]?.count || 0) > 0
        }));

        // Get analytics for recent polls
        const recentPollIds = polls.slice(0, 5).map(p => p.id);
        const analyticsPromises = recentPollIds.map(id => getRealTimeStats(id));
        const statsResults = await Promise.allSettled(analyticsPromises);
        
        analytics = statsResults
          .filter(result => result.status === 'fulfilled')
          .map((result, index) => ({
            pollId: recentPollIds[index],
            ...(result as PromiseFulfilledResult<any>).value
          }));

        // Get recent activity (simplified)
        recentActivity = polls.slice(0, 5).map(poll => ({
          type: 'poll_created',
          pollId: poll.id,
          question: poll.question,
          timestamp: poll.createdAt,
          votes: poll.totalVotes
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Polls Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create and manage your polls with real-time analytics
        </p>
      </div>

      <PollsDashboard 
        polls={polls}
        analytics={analytics}
        recentActivity={recentActivity}
        isAuthenticated={!!user}
      />
    </div>
  );
}
