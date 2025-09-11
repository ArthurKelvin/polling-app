'use client';

import { use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, BarChart3 } from 'lucide-react';

interface StatsData {
  totalPolls: number;
  totalVotes: number;
}

interface RealTimeStatsProps {
  statsPromise: Promise<StatsData>;
}

// Client Component using React 19's `use` hook for streaming
export function RealTimeStats({ statsPromise }: RealTimeStatsProps) {
  // React 19's `use` hook - suspends until promise resolves
  const stats = use(statsPromise);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
          <BarChart3 className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalPolls}</div>
          <p className="text-xs text-blue-100">
            Active polling sessions
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
          <Users className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalVotes}</div>
          <p className="text-xs text-green-100">
            Votes cast across all polls
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Participation</CardTitle>
          <TrendingUp className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalPolls > 0 
              ? Math.round(stats.totalVotes / stats.totalPolls) 
              : 0
            }
          </div>
          <p className="text-xs text-purple-100">
            Votes per poll
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
