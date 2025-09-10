/**
 * Poll Analytics and Statistics System
 * 
 * This module provides comprehensive analytics and statistics tracking
 * for polls, including real-time data, engagement metrics, and insights.
 */

import { getSupabaseServerClient } from "@/lib/auth/server";

export interface PollAnalytics {
  pollId: string;
  totalVotes: number;
  uniqueVoters: number;
  voteDistribution: VoteDistribution[];
  engagement: EngagementMetrics;
  timeline: TimelineData[];
  demographics?: DemographicsData;
}

export interface VoteDistribution {
  optionId: string;
  optionLabel: string;
  voteCount: number;
  percentage: number;
  position: number;
}

export interface EngagementMetrics {
  views: number;
  votesPerView: number;
  completionRate: number;
  averageTimeToVote: number; // in seconds
  peakVotingHour: number;
  bounceRate: number;
}

export interface TimelineData {
  timestamp: string;
  votes: number;
  views: number;
  hour: number;
}

export interface DemographicsData {
  totalUsers: number;
  newUsers: number;
  returningUsers: number;
  userRetentionRate: number;
}

/**
 * Get comprehensive analytics for a specific poll
 * 
 * @param pollId - The ID of the poll to analyze
 * @returns Promise resolving to poll analytics data
 */
export async function getPollAnalytics(pollId: string): Promise<PollAnalytics> {
  const supabase = await getSupabaseServerClient();

  try {
    // Get poll basic info
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("id, question, created_at")
      .eq("id", pollId)
      .single();

    if (pollError || !poll) {
      throw new Error("Poll not found");
    }

    // Get vote distribution
    const { data: voteDistribution, error: voteError } = await supabase
      .from("poll_options")
      .select(`
        id,
        label,
        position,
        votes:votes(count)
      `)
      .eq("poll_id", pollId)
      .order("position");

    if (voteError) {
      throw new Error("Failed to fetch vote distribution");
    }

    // Get total votes and unique voters
    const { data: voteStats, error: statsError } = await supabase
      .from("votes")
      .select("user_id, created_at")
      .eq("poll_id", pollId);

    if (statsError) {
      throw new Error("Failed to fetch vote statistics");
    }

    const totalVotes = voteStats?.length || 0;
    const uniqueVoters = new Set(voteStats?.map(v => v.user_id)).size;

    // Calculate vote distribution with percentages
    const distribution: VoteDistribution[] = voteDistribution?.map(option => {
      const voteCount = option.votes?.[0]?.count || 0;
      return {
        optionId: option.id,
        optionLabel: option.label,
        voteCount,
        percentage: totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0,
        position: option.position
      };
    }) || [];

    // Get engagement metrics
    const engagement = await calculateEngagementMetrics(supabase, pollId, totalVotes);

    // Get timeline data
    const timeline = await getTimelineData(supabase, pollId);

    return {
      pollId,
      totalVotes,
      uniqueVoters,
      voteDistribution: distribution,
      engagement,
      timeline
    };

  } catch (error) {
    console.error("Error fetching poll analytics:", error);
    throw new Error("Failed to fetch poll analytics");
  }
}

/**
 * Calculate engagement metrics for a poll
 */
async function calculateEngagementMetrics(
  supabase: any,
  pollId: string,
  totalVotes: number
): Promise<EngagementMetrics> {
  // This is a simplified implementation
  // In a real application, you'd track views and other metrics
  
  const views = totalVotes * 3; // Estimate views as 3x votes
  const votesPerView = views > 0 ? totalVotes / views : 0;
  const completionRate = votesPerView * 100;
  
  return {
    views,
    votesPerView,
    completionRate,
    averageTimeToVote: 45, // Estimated 45 seconds
    peakVotingHour: 14, // 2 PM
    bounceRate: Math.max(0, 100 - completionRate)
  };
}

/**
 * Get timeline data for poll activity
 */
async function getTimelineData(supabase: any, pollId: string): Promise<TimelineData[]> {
  // This is a simplified implementation
  // In a real application, you'd have proper view tracking
  
  const { data: votes, error } = await supabase
    .from("votes")
    .select("created_at")
    .eq("poll_id", pollId)
    .order("created_at");

  if (error || !votes) {
    return [];
  }

  // Group votes by hour
  const hourlyData = new Map<number, { votes: number; views: number }>();
  
  votes.forEach((vote: any) => {
    const hour = new Date(vote.created_at).getHours();
    const current = hourlyData.get(hour) || { votes: 0, views: 0 };
    current.votes++;
    current.views += 3; // Estimate views
    hourlyData.set(hour, current);
  });

  return Array.from(hourlyData.entries()).map(([hour, data]) => ({
    timestamp: new Date().toISOString(),
    votes: data.votes,
    views: data.views,
    hour
  }));
}

/**
 * Get analytics for all polls owned by a user
 * 
 * @param userId - The ID of the user
 * @returns Promise resolving to array of poll analytics
 */
export async function getUserPollAnalytics(userId: string): Promise<PollAnalytics[]> {
  const supabase = await getSupabaseServerClient();

  try {
    const { data: polls, error } = await supabase
      .from("polls")
      .select("id")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error || !polls) {
      throw new Error("Failed to fetch user polls");
    }

    const analyticsPromises = polls.map(poll => getPollAnalytics(poll.id));
    return await Promise.all(analyticsPromises);

  } catch (error) {
    console.error("Error fetching user poll analytics:", error);
    throw new Error("Failed to fetch user poll analytics");
  }
}

/**
 * Get real-time poll statistics
 * 
 * @param pollId - The ID of the poll
 * @returns Promise resolving to real-time stats
 */
export async function getRealTimeStats(pollId: string): Promise<{
  totalVotes: number;
  recentVotes: number; // votes in last 5 minutes
  topOption: string;
  isActive: boolean;
}> {
  const supabase = await getSupabaseServerClient();

  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // Get total votes
    const { count: totalVotes, error: totalError } = await supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("poll_id", pollId);

    if (totalError) {
      throw new Error("Failed to fetch total votes");
    }

    // Get recent votes
    const { count: recentVotes, error: recentError } = await supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("poll_id", pollId)
      .gte("created_at", fiveMinutesAgo);

    if (recentError) {
      throw new Error("Failed to fetch recent votes");
    }

    // Get top option
    const { data: topOption, error: optionError } = await supabase
      .from("poll_options")
      .select("label, votes:votes(count)")
      .eq("poll_id", pollId)
      .order("votes(count)", { ascending: false })
      .limit(1)
      .single();

    if (optionError) {
      throw new Error("Failed to fetch top option");
    }

    return {
      totalVotes: totalVotes || 0,
      recentVotes: recentVotes || 0,
      topOption: topOption?.label || "No votes yet",
      isActive: (recentVotes || 0) > 0
    };

  } catch (error) {
    console.error("Error fetching real-time stats:", error);
    throw new Error("Failed to fetch real-time stats");
  }
}
