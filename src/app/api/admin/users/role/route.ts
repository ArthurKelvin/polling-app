import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { assignUserRole } from '@/lib/auth/roles';
import type { UserRole } from '@/types/auth';

/**
 * API route to update user role (admin only)
 * POST /api/admin/users/role
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const { userId, role }: { userId: string; role: UserRole } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and role' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'moderator', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, moderator, or user' },
        { status: 400 }
      );
    }

    // Prevent users from changing their own role
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Assign the role
    const result = await assignUserRole(user.id, userId, role);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin role update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
