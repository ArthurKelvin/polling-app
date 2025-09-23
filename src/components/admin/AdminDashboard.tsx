"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  BarChart3, 
  Shield, 
  Settings, 
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database
} from 'lucide-react';
import { UserManagement } from './UserManagement';
import { SystemAnalytics } from './SystemAnalytics';
import { ContentModeration } from './ContentModeration';
import { PlatformSettings } from './PlatformSettings';

interface SystemStats {
  totalUsers: number;
  totalPolls: number;
  totalVotes: number;
  activeUsers: number;
  recentActivity: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalPolls: 0,
    totalVotes: 0,
    activeUsers: 0,
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend 
  }: { 
    title: string; 
    value: number | string; 
    description: string; 
    icon: React.ComponentType<{ className?: string }>; 
    trend?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
          {trend && <span className="ml-2 text-green-600">{trend}</span>}
        </p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              ADMIN
            </div>
          </div>
          <p className="text-gray-600">
            Manage users, content, and platform settings
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            description="Registered users"
            icon={Users}
            trend="+12%"
          />
          <StatCard
            title="Total Polls"
            value={stats.totalPolls}
            description="Created polls"
            icon={BarChart3}
            trend="+8%"
          />
          <StatCard
            title="Total Votes"
            value={stats.totalVotes}
            description="Votes cast"
            icon={TrendingUp}
            trend="+15%"
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            description="Last 24 hours"
            icon={Activity}
            trend="+5%"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <SystemAnalytics />
          </TabsContent>

          <TabsContent value="moderation">
            <ContentModeration />
          </TabsContent>

          <TabsContent value="settings">
            <PlatformSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
