import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { 
  getPollComments, 
  createComment, 
  updateComment, 
  deleteComment 
} from '@/lib/comments/service';

/**
 * API route for comments
 * GET /api/comments - Get comments for a poll
 * POST /api/comments - Create a new comment
 * PUT /api/comments - Update a comment
 * DELETE /api/comments - Delete a comment
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pollId = searchParams.get('pollId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      );
    }

    const result = await getPollComments(pollId, limit, offset);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ comments: result.comments });
  } catch (error) {
    console.error('Error in comments GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { pollId, content, parentId }: { pollId: string; content: string; parentId?: string } = await request.json();

    if (!pollId || !content) {
      return NextResponse.json(
        { error: 'Poll ID and content are required' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Comment content must be 1000 characters or less' },
        { status: 400 }
      );
    }

    // Create comment
    const result = await createComment(user.id, {
      pollId,
      content,
      parentId
    });
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment: result.comment });
  } catch (error) {
    console.error('Error in comments POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { commentId, content }: { commentId: string; content: string } = await request.json();

    if (!commentId || !content) {
      return NextResponse.json(
        { error: 'Comment ID and content are required' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Comment content must be 1000 characters or less' },
        { status: 400 }
      );
    }

    // Update comment
    const result = await updateComment(commentId, user.id, content);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in comments PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const { commentId }: { commentId: string } = await request.json();

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    // Delete comment
    const result = await deleteComment(commentId, user.id);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in comments DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
