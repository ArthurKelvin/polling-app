
create or replace function public.get_poll_results(p_poll_id uuid)
returns table(label text, votes bigint)
language plpgsql
as $$
begin
  return query
  select
    pr.label,
    pr.votes_count as votes
  from public.poll_results pr
  where pr.poll_id = p_poll_id
  order by pr.label;
end;
$$;
