import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/auth/server';

export async function POST(request: NextRequest) {
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

    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and role are required' 
      }, { status: 400 });
    }

    if (!['admin', 'moderator', 'user'].includes(role)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid role. Must be admin, moderator, or user' 
      }, { status: 400 });
    }

    // Update user role
    const { error: updateError } = await supabase
      .from('user_roles')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update user role' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User role updated successfully'
    });

  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}