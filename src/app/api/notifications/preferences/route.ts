import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/auth/server';

/**
 * API route for notification preferences
 * GET /api/notifications/preferences - Get user notification preferences
 * POST /api/notifications/preferences - Update user notification preferences
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user preferences from user metadata
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('raw_user_meta_data')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // Default preferences
    const defaultPreferences = {
      emailNotifications: true,
      pollCreated: true,
      pollClosing: true,
      pollResults: true,
      newComments: true,
      closingReminderHours: 24
    };

    const preferences = userData?.raw_user_meta_data?.notificationPreferences || defaultPreferences;

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error in notification preferences GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    type Preferences = {
      emailNotifications?: unknown;
      pollCreated?: unknown;
      pollClosing?: unknown;
      pollResults?: unknown;
      newComments?: unknown;
      closingReminderHours?: unknown;
    };
    const { preferences }: { preferences: Preferences } = await request.json();

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences are required' },
        { status: 400 }
      );
    }

    // Validate preferences
    const closingHoursRaw = preferences.closingReminderHours;
    const closingHours = typeof closingHoursRaw === 'string' ? parseInt(closingHoursRaw, 10) : Number(closingHoursRaw);
    const validPreferences = {
      emailNotifications: Boolean(preferences.emailNotifications),
      pollCreated: Boolean(preferences.pollCreated),
      pollClosing: Boolean(preferences.pollClosing),
      pollResults: Boolean(preferences.pollResults),
      newComments: Boolean(preferences.newComments),
      closingReminderHours: Math.max(1, Math.min(168, Number.isFinite(closingHours) ? closingHours : 24))
    };

    // Update user metadata with preferences
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        notificationPreferences: validPreferences
      }
    });

    if (updateError) {
      console.error('Error updating user preferences:', updateError);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      preferences: validPreferences 
    });
  } catch (error) {
    console.error('Error in notification preferences POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
