import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated',
        isAdmin: false 
      });
    }

    // Check user role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch role',
        isAdmin: false,
        userEmail: user.email 
      });
    }

    const isAdmin = userRole?.role === 'admin';

    return NextResponse.json({
      success: true,
      isAdmin,
      role: userRole?.role || 'user',
      userEmail: user.email,
      userId: user.id
    });

  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      isAdmin: false 
    });
  }
}
