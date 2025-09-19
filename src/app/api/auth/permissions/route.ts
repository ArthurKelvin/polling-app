import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getUserPermissions } from '@/lib/auth/roles';

/**
 * API route to get user permissions
 * GET /api/auth/permissions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user permissions
    const permissions = await getUserPermissions(user.id);
    
    if (!permissions) {
      return NextResponse.json(
        { error: 'Failed to fetch permissions' },
        { status: 500 }
      );
    }

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error in permissions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
