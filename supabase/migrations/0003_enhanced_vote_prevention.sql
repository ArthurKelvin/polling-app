-- Enhanced schema design to prevent multiple votes per user per poll
-- This migration enhances the existing vote prevention mechanisms

-- 1. Add a unique constraint index for better performance
-- (The constraint already exists, but let's add an explicit index)
create unique index if not exists votes_unique_user_poll_idx 
on public.votes (poll_id, user_id);

-- 2. Add a function to check if user has already voted
create or replace function public.user_has_voted(p_poll_id uuid, p_user_id uuid default auth.uid())
returns boolean
language plpgsql
security definer
as $$
begin
  if p_user_id is null then
    return false;
  end if;
  
  return exists(
    select 1 from public.votes 
    where poll_id = p_poll_id and user_id = p_user_id
  );
end;
$$;

-- 3. Enhanced vote casting function with better error handling
create or replace function public.cast_vote_enhanced(
  p_poll_id uuid, 
  p_option_id uuid,
  p_allow_update boolean default false
)
returns json
language plpgsql
security definer
as $$
declare
  v_user uuid := auth.uid();
  v_option_poll uuid;
  v_poll_exists boolean;
  v_user_has_voted boolean;
  v_vote_id uuid;
  v_result json;
begin
  -- Check authentication
  if v_user is null then
    return json_build_object(
      'success', false,
      'error', 'Not authenticated',
      'error_code', 'AUTH_REQUIRED'
    );
  end if;

  -- Check if poll exists and is active
  select exists(
    select 1 from public.polls 
    where id = p_poll_id and is_public = true
  ) into v_poll_exists;
  
  if not v_poll_exists then
    return json_build_object(
      'success', false,
      'error', 'Poll does not exist or is not public',
      'error_code', 'POLL_NOT_FOUND'
    );
  end if;

  -- Check if option belongs to poll
  select o.poll_id into v_option_poll 
  from public.poll_options o 
  where o.id = p_option_id;
  
  if v_option_poll is null or v_option_poll <> p_poll_id then
    return json_build_object(
      'success', false,
      'error', 'Option does not belong to poll',
      'error_code', 'INVALID_OPTION'
    );
  end if;

  -- Check if user has already voted
  select public.user_has_voted(p_poll_id, v_user) into v_user_has_voted;
  
  if v_user_has_voted and not p_allow_update then
    return json_build_object(
      'success', false,
      'error', 'You have already voted on this poll',
      'error_code', 'ALREADY_VOTED',
      'can_update', true
    );
  end if;

  -- Insert or update vote
  if v_user_has_voted and p_allow_update then
    -- Update existing vote
    update public.votes 
    set option_id = p_option_id, created_at = now()
    where poll_id = p_poll_id and user_id = v_user
    returning id into v_vote_id;
  else
    -- Insert new vote
    insert into public.votes (poll_id, option_id, user_id)
    values (p_poll_id, p_option_id, v_user)
    returning id into v_vote_id;
  end if;

  -- Return success with vote details
  return json_build_object(
    'success', true,
    'vote_id', v_vote_id,
    'message', case 
      when v_user_has_voted then 'Vote updated successfully'
      else 'Vote cast successfully'
    end
  );

exception
  when unique_violation then
    return json_build_object(
      'success', false,
      'error', 'You have already voted on this poll',
      'error_code', 'ALREADY_VOTED'
    );
  when others then
    return json_build_object(
      'success', false,
      'error', 'An error occurred while casting vote',
      'error_code', 'VOTE_ERROR'
    );
end;
$$;

-- 4. Function to get user's vote for a specific poll
create or replace function public.get_user_vote(p_poll_id uuid, p_user_id uuid default auth.uid())
returns table (
  vote_id uuid,
  option_id uuid,
  option_label text,
  voted_at timestamptz
)
language plpgsql
security definer
as $$
begin
  if p_user_id is null then
    return;
  end if;
  
  return query
  select 
    v.id as vote_id,
    v.option_id,
    o.label as option_label,
    v.created_at as voted_at
  from public.votes v
  join public.poll_options o on o.id = v.option_id
  where v.poll_id = p_poll_id and v.user_id = p_user_id;
end;
$$;

-- 5. Enhanced poll results view with user vote information
create or replace view public.poll_results_with_user_vote as
select
  o.poll_id,
  o.id as option_id,
  o.label,
  count(v.id) as votes_count,
  -- Check if current user voted for this option
  exists(
    select 1 from public.votes v2 
    where v2.poll_id = o.poll_id 
    and v2.option_id = o.id 
    and v2.user_id = auth.uid()
  ) as user_voted_for_this_option,
  -- Get current user's vote for this poll
  case 
    when exists(select 1 from public.votes v3 where v3.poll_id = o.poll_id and v3.user_id = auth.uid())
    then (
      select v4.option_id from public.votes v4 
      where v4.poll_id = o.poll_id and v4.user_id = auth.uid()
    )
    else null
  end as user_voted_option_id
from public.poll_options o
left join public.votes v on v.option_id = o.id
group by o.poll_id, o.id, o.label;

-- 6. Add RLS policy to prevent duplicate vote insertion
drop policy if exists "votes_insert_authenticated_once" on public.votes;
create policy "votes_insert_authenticated_once"
on public.votes for insert
with check (
  user_id = auth.uid() and
  not exists (
    select 1 from public.votes v2 
    where v2.poll_id = poll_id and v2.user_id = auth.uid()
  )
);

-- 7. Add policy to allow vote updates (if needed)
drop policy if exists "votes_update_own_vote" on public.votes;
create policy "votes_update_own_vote"
on public.votes for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- 8. Add a trigger to automatically update poll vote counts
create or replace function public.update_poll_vote_count()
returns trigger
language plpgsql
as $$
begin
  -- Update the poll's total vote count
  update public.polls 
  set total_votes = (
    select count(*) from public.votes where poll_id = new.poll_id
  )
  where id = new.poll_id;
  
  return new;
end;
$$;

-- Create trigger for vote count updates
drop trigger if exists trg_update_poll_vote_count on public.votes;
create trigger trg_update_poll_vote_count
after insert or delete on public.votes
for each row execute function public.update_poll_vote_count();

-- 9. Add a function to get poll statistics
create or replace function public.get_poll_stats(p_poll_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_poll_stats json;
  v_user_voted boolean;
begin
  -- Check if user has voted
  select public.user_has_voted(p_poll_id, auth.uid()) into v_user_voted;
  
  -- Get poll statistics
  select json_build_object(
    'poll_id', p_poll_id,
    'total_votes', count(v.id),
    'user_has_voted', v_user_voted,
    'user_vote_option_id', case 
      when v_user_voted then (
        select v2.option_id from public.votes v2 
        where v2.poll_id = p_poll_id and v2.user_id = auth.uid()
      )
      else null
    end,
    'options', json_agg(
      json_build_object(
        'option_id', o.id,
        'label', o.label,
        'votes', count(v.id),
        'user_voted_for_this', exists(
          select 1 from public.votes v3 
          where v3.poll_id = p_poll_id 
          and v3.option_id = o.id 
          and v3.user_id = auth.uid()
        )
      )
    )
  ) into v_poll_stats
  from public.poll_options o
  left join public.votes v on v.option_id = o.id
  where o.poll_id = p_poll_id
  group by o.poll_id;
  
  return v_poll_stats;
end;
$$;
