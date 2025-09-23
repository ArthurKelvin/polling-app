

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCurrentUser } from '@/lib/auth/actions';
import { getUserPollAnalytics, getRealTimeStats } from '@/lib/analytics';
import { PollsDashboard } from '@/components/polls/PollsDashboard';
import { AdminAccessBanner } from '@/components/admin/AdminAccessBanner';

interface PollSummary {
  id: string;
  question: string;
  totalVotes: number;
  createdAt: string;
  isActive: boolean;
}

interface DashboardAnalytics {
  pollId: string;
  totalVotes: number;
  recentVotes: number;
  topOption: string;
  isActive: boolean;
}

export default async function PollsPage() {
  const supabase = await getSupabaseServerClient();
  const user = await getCurrentUser(supabase);

  let polls: PollSummary[] = [];
  type ActivityEntry = {
    type: 'poll_created';
    pollId: string;
    question: string;
    timestamp: string;
    votes: number;
  };
  let analytics: DashboardAnalytics[] = [];
  let recentActivity: ActivityEntry[] = [];

  if (user) {
    try {
      // Get user's polls
      const baseQuery = supabase
        .from("polls")
        .select(`
          id,
          question,
          created_at
        `);
      const { data: userPolls, error: pollsError } = await (user.user
        ? baseQuery.eq("owner_id", user.user.id)
        : baseQuery)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!pollsError && userPolls) {
        // Get vote counts for each poll
        const pollsWithVotes = await Promise.all(
          userPolls.map(async (poll) => {
            const { count: voteCount, error: voteError } = await supabase
              .from("votes")
              .select("*", { count: "exact", head: true })
              .eq("poll_id", poll.id);

            if (voteError) {
              console.warn(`Failed to count votes for poll ${poll.id}:`, voteError);
            }

            return {
              id: poll.id,
              question: poll.question,
              totalVotes: voteCount || 0,
              createdAt: poll.created_at,
              isActive: (voteCount || 0) > 0
            };
          })
        );

        polls = pollsWithVotes;

        // Get analytics for recent polls
        const recentPollIds = polls.slice(0, 5).map(p => p.id);
        const analyticsPromises = recentPollIds.map(id => getRealTimeStats(id));
        const statsResults = await Promise.allSettled(analyticsPromises as Promise<DashboardAnalytics extends { pollId: string } ? never : Promise<{
          totalVotes: number;
          recentVotes: number;
          topOption: string;
          isActive: boolean;
        }>>[]);
        
        analytics = (statsResults
          .filter(result => result.status === 'fulfilled')
          .map((result, index) => {
            const value = (result as PromiseFulfilledResult<{ totalVotes: number; recentVotes: number; topOption: string; isActive: boolean; }>).value;
            return {
              pollId: recentPollIds[index],
              totalVotes: value.totalVotes,
              recentVotes: value.recentVotes,
              topOption: value.topOption,
              isActive: value.isActive,
            } as DashboardAnalytics;
          })) as DashboardAnalytics[];

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

      {/* Admin Access Banner */}
      <AdminAccessBanner />

      <PollsDashboard 
        polls={polls}
        analytics={analytics}
        recentActivity={recentActivity}
        isAuthenticated={!!user}
      />
    </div>
  );
}
