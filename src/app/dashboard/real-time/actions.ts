'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface FormState {
  success?: boolean;
  error?: string;
  pollId?: string;
}

export async function createPollAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        error: 'You must be logged in to create a poll',
      };
    }

    // Extract form data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const option1 = formData.get('option1') as string;
    const option2 = formData.get('option2') as string;
    const option3 = formData.get('option3') as string;
    const option4 = formData.get('option4') as string;

    // Validate required fields
    if (!title || !option1 || !option2) {
      return {
        error: 'Title and at least two options are required',
      };
    }

    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title,
        description: description || null,
        user_id: user.id,
        total_votes: 0,
      })
      .select()
      .single();

    if (pollError) {
      return {
        error: 'Failed to create poll: ' + pollError.message,
      };
    }

    // Create poll options
    const options = [
      { text: option1, poll_id: poll.id, votes: 0 },
      { text: option2, poll_id: poll.id, votes: 0 },
    ];

    // Add optional options
    if (option3) {
      options.push({ text: option3, poll_id: poll.id, votes: 0 });
    }
    if (option4) {
      options.push({ text: option4, poll_id: poll.id, votes: 0 });
    }

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(options);

    if (optionsError) {
      return {
        error: 'Failed to create poll options: ' + optionsError.message,
      };
    }

    // Revalidate the dashboard page to show new poll
    revalidatePath('/dashboard/real-time');

    return {
      success: true,
      pollId: poll.id,
    };

  } catch (error) {
    console.error('Error creating poll:', error);
    return {
      error: 'An unexpected error occurred while creating the poll',
    };
  }
}

export async function voteAction(
  pollId: string,
  optionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to vote',
      };
    }

    // Check if user already voted on this poll
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', user.id)
      .single();

    if (existingVote) {
      return {
        success: false,
        error: 'You have already voted on this poll',
      };
    }

    // Record the vote
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: user.id,
      });

    if (voteError) {
      return {
        success: false,
        error: 'Failed to record vote: ' + voteError.message,
      };
    }

    // Update option vote count
    const { error: optionError } = await supabase
      .from('poll_options')
      .update({ votes: supabase.raw('votes + 1') })
      .eq('id', optionId);

    if (optionError) {
      return {
        success: false,
        error: 'Failed to update vote count: ' + optionError.message,
      };
    }

    // Update poll total votes
    const { error: pollError } = await supabase
      .from('polls')
      .update({ total_votes: supabase.raw('total_votes + 1') })
      .eq('id', pollId);

    if (pollError) {
      return {
        success: false,
        error: 'Failed to update poll total: ' + pollError.message,
      };
    }

    // Revalidate the dashboard page
    revalidatePath('/dashboard/real-time');

    return { success: true };

  } catch (error) {
    console.error('Error voting:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while voting',
    };
  }
}
