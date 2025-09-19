import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getAllUsersWithRoles } from '@/lib/auth/roles';

/**
 * API route to get all users with their roles (admin only)
 * GET /api/admin/users
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

    // Get all users with roles
    const result = await getAllUsersWithRoles(user.id);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 403 }
      );
    }

    return NextResponse.json({ users: result.users });
  } catch (error) {
    console.error('Error in admin users API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
