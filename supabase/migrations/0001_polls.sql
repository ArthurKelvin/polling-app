-- Polling app schema for Supabase
-- Uses auth.users (UUID) as the source of user identities

-- Extension (if needed for UUID generation); Supabase usually has this
create extension if not exists "uuid-ossp";

-- POLLS
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists polls_owner_id_idx on public.polls(owner_id);
create index if not exists polls_created_at_idx on public.polls(created_at desc);

-- trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_polls_updated_at on public.polls;
create trigger trg_polls_updated_at
before update on public.polls
for each row execute function public.set_updated_at();

-- POLL OPTIONS
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists poll_options_poll_id_idx on public.poll_options(poll_id);
create index if not exists poll_options_position_idx on public.poll_options(poll_id, position);

-- VOTES
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint votes_unique_per_user_per_poll unique (poll_id, user_id)
);

create index if not exists votes_poll_id_idx on public.votes(poll_id);
create index if not exists votes_option_id_idx on public.votes(option_id);
create index if not exists votes_user_id_idx on public.votes(user_id);

-- VIEW: poll results (option counts)
create or replace view public.poll_results as
  select
    o.poll_id,
    o.id as option_id,
    o.label,
    count(v.id) as votes_count
  from public.poll_options o
  left join public.votes v on v.option_id = o.id
  group by o.poll_id, o.id, o.label;

-- RLS
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.votes enable row level security;

-- Policies for polls
drop policy if exists "polls_select_public_or_owner" on public.polls;
create policy "polls_select_public_or_owner"
on public.polls for select
using (
  is_public = true or owner_id = auth.uid()
);

drop policy if exists "polls_insert_owner_is_uid" on public.polls;
create policy "polls_insert_owner_is_uid"
on public.polls for insert
with check ( owner_id = auth.uid() );

drop policy if exists "polls_update_only_owner" on public.polls;
create policy "polls_update_only_owner"
on public.polls for update
using ( owner_id = auth.uid() )
with check ( owner_id = auth.uid() );

drop policy if exists "polls_delete_only_owner" on public.polls;
create policy "polls_delete_only_owner"
on public.polls for delete
using ( owner_id = auth.uid() );

-- Policies for poll_options (inherit ownership via poll)
drop policy if exists "options_select_public_or_owner" on public.poll_options;
create policy "options_select_public_or_owner"
on public.poll_options for select
using (
  exists (
    select 1 from public.polls p
    where p.id = poll_id and (p.is_public = true or p.owner_id = auth.uid())
  )
);

drop policy if exists "options_modify_only_owner" on public.poll_options;
create policy "options_modify_only_owner"
on public.poll_options for all
using (
  exists (
    select 1 from public.polls p
    where p.id = poll_id and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.polls p
    where p.id = poll_id and p.owner_id = auth.uid()
  )
);

-- Policies for votes
drop policy if exists "votes_select_owner_user_or_public" on public.votes;
create policy "votes_select_owner_user_or_public"
on public.votes for select
using (
  user_id = auth.uid() or
  exists (
    select 1 from public.polls p where p.id = poll_id and (p.is_public = true or p.owner_id = auth.uid())
  )
);

drop policy if exists "votes_insert_authenticated_once" on public.votes;
create policy "votes_insert_authenticated_once"
on public.votes for insert
with check (
  user_id = auth.uid()
);

drop policy if exists "votes_delete_only_owner_or_poll_owner" on public.votes;
create policy "votes_delete_only_owner_or_poll_owner"
on public.votes for delete
using (
  user_id = auth.uid() or
  exists (
    select 1 from public.polls p where p.id = poll_id and p.owner_id = auth.uid()
  )
);

-- Helpful function to cast a vote safely (checks option belongs to poll)
create or replace function public.cast_vote(p_poll_id uuid, p_option_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_user uuid := auth.uid();
  v_option_poll uuid;
  v_poll_exists boolean;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  -- Check if poll exists
  select exists(select 1 from public.polls where id = p_poll_id) into v_poll_exists;
  if not v_poll_exists then
    raise exception 'Poll does not exist';
  end if;

  -- Check if option belongs to poll
  select o.poll_id into v_option_poll from public.poll_options o where o.id = p_option_id;
  if v_option_poll is null or v_option_poll <> p_poll_id then
    raise exception 'Option does not belong to poll';
  end if;

  insert into public.votes (poll_id, option_id, user_id)
  values (p_poll_id, p_option_id, v_user)
  on conflict (poll_id, user_id) do update
    set option_id = excluded.option_id;
end;
$$;