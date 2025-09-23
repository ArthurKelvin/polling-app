"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertTriangle, 
  Trash2, 
  Eye, 
  Search,
  Filter,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  User
} from 'lucide-react';
import { toast } from 'sonner';

interface Poll {
  id: string;
  title: string;
  description?: string;
  owner_email: string;
  created_at: string;
  total_votes: number;
  status: 'active' | 'reported' | 'hidden' | 'deleted';
  report_count: number;
  last_reported?: string;
}

interface Report {
  id: string;
  poll_id: string;
  poll_title: string;
  reporter_email: string;
  reason: string;
  description: string;
  created_at: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export function ContentModeration() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('polls');

  useEffect(() => {
    fetchModerationData();
  }, []);

  const fetchModerationData = async () => {
    try {
      setLoading(true);
      const [pollsResponse, reportsResponse] = await Promise.all([
        fetch('/api/admin/moderation/polls'),
        fetch('/api/admin/moderation/reports')
      ]);

      if (pollsResponse.ok) {
        const pollsData = await pollsResponse.json();
        setPolls(pollsData.polls || []);
      }

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData.reports || []);
      }
    } catch (error) {
      console.error('Failed to fetch moderation data:', error);
      toast.error('Failed to fetch moderation data');
    } finally {
      setLoading(false);
    }
  };

  const moderatePoll = async (pollId: string, action: 'hide' | 'delete' | 'approve') => {
    try {
      const response = await fetch('/api/admin/moderation/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pollId, action }),
      });

      if (response.ok) {
        toast.success(`Poll ${action}d successfully`);
        fetchModerationData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.message || `Failed to ${action} poll`);
      }
    } catch (error) {
      console.error(`Failed to ${action} poll:`, error);
      toast.error(`Failed to ${action} poll`);
    }
  };

  const resolveReport = async (reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      const response = await fetch('/api/admin/moderation/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportId, action }),
      });

      if (response.ok) {
        toast.success(`Report ${action}d successfully`);
        fetchModerationData(); // Refresh data
      } else {
        const error = await response.json();
        toast.error(error.message || `Failed to ${action} report`);
      }
    } catch (error) {
      console.error(`Failed to ${action} report:`, error);
      toast.error(`Failed to ${action} report`);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      reported: 'destructive',
      hidden: 'secondary',
      deleted: 'outline',
      pending: 'destructive',
      resolved: 'default',
      dismissed: 'secondary'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPolls = polls.filter(poll => {
    const matchesSearch = poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         poll.owner_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || poll.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.poll_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reporter_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Content Moderation
          </h2>
          <p className="text-gray-600">Manage reported content and moderate polls</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'polls' ? 'default' : 'outline'}
            onClick={() => setActiveTab('polls')}
          >
            Polls ({polls.length})
          </Button>
          <Button
            variant={activeTab === 'reports' ? 'default' : 'outline'}
            onClick={() => setActiveTab('reports')}
          >
            Reports ({reports.length})
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Status</option>
          {activeTab === 'polls' ? (
            <>
              <option value="active">Active</option>
              <option value="reported">Reported</option>
              <option value="hidden">Hidden</option>
              <option value="deleted">Deleted</option>
            </>
          ) : (
            <>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </>
          )}
        </select>
      </div>

      {/* Polls Tab */}
      {activeTab === 'polls' && (
        <Card>
          <CardHeader>
            <CardTitle>Poll Moderation</CardTitle>
            <CardDescription>Review and moderate poll content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Poll</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Votes</TableHead>
                    <TableHead>Reports</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPolls.map((poll) => (
                    <TableRow key={poll.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{poll.title}</div>
                          {poll.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {poll.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{poll.owner_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(poll.status)}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{poll.total_votes}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm">{poll.report_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {formatDate(poll.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moderatePoll(poll.id, 'hide')}
                            disabled={poll.status === 'hidden' || poll.status === 'deleted'}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Hide
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => moderatePoll(poll.id, 'delete')}
                            disabled={poll.status === 'deleted'}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                          {poll.status !== 'active' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => moderatePoll(poll.id, 'approve')}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredPolls.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No polls found matching your criteria.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <Card>
          <CardHeader>
            <CardTitle>Content Reports</CardTitle>
            <CardDescription>Review and resolve content reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{report.poll_title}</h4>
                      <p className="text-sm text-gray-500">Reported by: {report.reporter_email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(report.status)}
                      <span className="text-sm text-gray-500">
                        {formatDate(report.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">Reason: {report.reason}</p>
                    <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => resolveReport(report.id, 'resolve')}
                      disabled={report.status !== 'pending'}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveReport(report.id, 'dismiss')}
                      disabled={report.status !== 'pending'}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
              {filteredReports.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No reports found matching your criteria.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
