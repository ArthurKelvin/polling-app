"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  pollsCreated: { date: string; count: number }[];
  votesCast: { date: string; count: number }[];
  userRegistrations: { date: string; count: number }[];
  topPolls: { id: string; title: string; votes: number }[];
  userActivity: { date: string; activeUsers: number }[];
  // Basic stats
  totalUsers?: number;
  totalPolls?: number;
  totalVotes?: number;
  activeUsers?: number;
  recentActivity?: number;
}

export function SystemAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    pollsCreated: [],
    votesCast: [],
    userRegistrations: [],
    topPolls: [],
    userActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/stats`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Transform the data to match our interface
          setAnalytics({
            pollsCreated: [], // We'll add this later
            votesCast: [], // We'll add this later
            userRegistrations: [], // We'll add this later
            topPolls: [], // We'll add this later
            userActivity: [], // We'll add this later
            // For now, just show the basic stats
            totalUsers: data.totalUsers,
            totalPolls: data.totalPolls,
            totalVotes: data.totalVotes,
            activeUsers: data.activeUsers,
            recentActivity: data.recentActivity
          });
        }
      } else {
        console.error('Failed to fetch analytics:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch(`/api/admin/analytics/export?range=${dateRange}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon 
  }: { 
    title: string; 
    value: string | number; 
    change?: string; 
    icon: React.ComponentType<{ className?: string }>; 
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">System Analytics</h2>
          <p className="text-gray-600">Platform usage and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Polls"
          value={analytics.totalPolls || 0}
          change={`+${analytics.recentActivity || 0} recent`}
          icon={BarChart3}
        />
        <StatCard
          title="Total Votes"
          value={analytics.totalVotes || 0}
          change="All time votes"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Users"
          value={analytics.totalUsers || 0}
          change={`${analytics.activeUsers || 0} active`}
          icon={Users}
        />
        <StatCard
          title="Active Users"
          value={analytics.activeUsers || 0}
          change="Last 24 hours"
          icon={Activity}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Polls Created Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Polls Created Over Time</CardTitle>
            <CardDescription>Daily poll creation trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Chart visualization would go here</p>
                <p className="text-sm">Data points: {analytics.pollsCreated.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Votes Cast Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Votes Cast Over Time</CardTitle>
            <CardDescription>Daily voting activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Chart visualization would go here</p>
                <p className="text-sm">Data points: {analytics.votesCast.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Polls Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Polls</CardTitle>
          <CardDescription>Most voted polls in the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topPolls.length > 0 ? (
              analytics.topPolls.map((poll, index) => (
                <div key={poll.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{poll.title}</p>
                      <p className="text-sm text-gray-500">ID: {poll.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{poll.votes}</p>
                    <p className="text-sm text-gray-500">votes</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No poll data available for the selected period.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
