import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole?.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin privileges required' 
      }, { status: 403 });
    }

    // Fetch system statistics
    const [
      { count: totalUsers },
      { count: totalPolls },
      { count: totalVotes },
      { count: recentActivity }
    ] = await Promise.all([
      supabase.from('user_roles').select('*', { count: 'exact', head: true }),
      supabase.from('polls').select('*', { count: 'exact', head: true }),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
      supabase
        .from('polls')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ]);

    // Get active users (users who have voted in the last 24 hours)
    const { data: activeUsersData } = await supabase
      .from('votes')
      .select('user_id')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Count unique active users
    const uniqueActiveUsers = new Set(activeUsersData?.map(vote => vote.user_id) || []).size;

    return NextResponse.json({
      success: true,
      totalUsers: totalUsers || 0,
      totalPolls: totalPolls || 0,
      totalVotes: totalVotes || 0,
      activeUsers: uniqueActiveUsers,
      recentActivity: recentActivity || 0
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
