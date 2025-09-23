import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/auth/server';

export async function POST() {
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

    // Check if user already has a role
    const { data: existingRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError && roleError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking existing role:', roleError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check existing role' 
      }, { status: 500 });
    }

    // If user already has admin role, return success
    if (existingRole?.role === 'admin') {
      return NextResponse.json({
        success: true,
        message: 'User already has admin privileges',
        isAdmin: true
      });
    }

    // Grant admin role to the user
    const { error: updateError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'admin',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (updateError) {
      console.error('Error granting admin role:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to grant admin privileges' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin privileges granted successfully',
      isAdmin: true,
      userEmail: user.email
    });

  } catch (error) {
    console.error('Make admin error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

