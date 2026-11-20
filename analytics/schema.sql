-- Applied to the Supabase project's default postgres database.
-- All tables are inaccessible to public players; only the Edge Function writes/reads.
create table if not exists public.bandmystery_versions (
  version text primary key check (length(version) between 1 and 64),
  description text not null check (length(description) between 1 and 2000),
  created_at timestamptz not null default now()
);
alter table public.bandmystery_versions enable row level security;
revoke all on public.bandmystery_versions from anon, authenticated;
grant select, insert, update, delete on public.bandmystery_versions to service_role;
insert into public.bandmystery_versions (version, description)
values ('v0', 'beta- single storyline with danzai being the murderer')
on conflict (version) do nothing;

create table if not exists public.bandmystery_events (
  event_id uuid primary key,
  run_id uuid not null,
  player_id uuid not null,
  version text not null check (length(version) between 1 and 64),
  seq integer not null check (seq > 0),
  kind text not null check (kind in ('start','resume','checkpoint','choice','ending','heartbeat','exit')),
  scene text not null check (length(scene) between 1 and 100),
  checkpoint text not null check (length(checkpoint) between 1 and 200),
  line integer check (line between 0 and 10000),
  choice text check (length(choice) <= 200),
  ending text check (length(ending) <= 100),
  active_ms bigint not null check (active_ms between 0 and 604800000),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  unique (run_id, seq)
);
create index if not exists bandmystery_events_run_time on public.bandmystery_events (run_id, seq desc);
create index if not exists bandmystery_events_starts on public.bandmystery_events (occurred_at, version) where kind = 'start';

create table if not exists public.bandmystery_settings (key text primary key, value text not null);
create table if not exists public.bandmystery_rate_limits (
  client_hash text primary key, window_start timestamptz not null, events integer not null
);

alter table public.bandmystery_events enable row level security;
alter table public.bandmystery_settings enable row level security;
alter table public.bandmystery_rate_limits enable row level security;
revoke all on public.bandmystery_events, public.bandmystery_settings, public.bandmystery_rate_limits from anon, authenticated;
grant select, insert, update, delete on public.bandmystery_events, public.bandmystery_settings, public.bandmystery_rate_limits to service_role;

create or replace function public.bandmystery_ingest(batch jsonb, client_hash text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare used integer;
begin
  if jsonb_typeof(batch) <> 'array' or jsonb_array_length(batch) not between 1 and 20 then
    raise exception 'Invalid batch';
  end if;
  insert into public.bandmystery_rate_limits as limits (client_hash, window_start, events)
  values (bandmystery_ingest.client_hash, date_trunc('minute', now()), jsonb_array_length(batch))
  on conflict on constraint bandmystery_rate_limits_pkey do update set
    events = case when limits.window_start = excluded.window_start then limits.events + excluded.events else excluded.events end,
    window_start = excluded.window_start
  returning events into used;
  if used > 240 then return false; end if;
  delete from public.bandmystery_rate_limits where window_start < now() - interval '2 hours';
  insert into public.bandmystery_events (event_id, run_id, player_id, version, seq, kind, scene, checkpoint, line, choice, ending, active_ms, occurred_at)
  select event_id, run_id, player_id, version, seq, kind, scene, checkpoint, line, choice, ending, active_ms,
    least(occurred_at, now())
  from jsonb_to_recordset(batch) as e (
    event_id uuid, run_id uuid, player_id uuid, version text, seq integer, kind text,
    scene text, checkpoint text, line integer, choice text, ending text, active_ms bigint, occurred_at timestamptz
  ) on conflict do nothing;
  return true;
end $$;
revoke all on function public.bandmystery_ingest(jsonb, text) from public, anon, authenticated;
grant execute on function public.bandmystery_ingest(jsonb, text) to service_role;

create or replace function public.bandmystery_summary(days integer default 30, build text default null)
returns jsonb language sql stable security invoker set search_path = '' as $$
with starts as (
  select run_id, min(occurred_at) as started_at
  from public.bandmystery_events
  where kind = 'start'
    and (days = 0 or occurred_at >= now() - make_interval(days => least(greatest(days, 1), 365)))
    and (build is null or version = build)
  group by run_id
), events as (
  select e.* from public.bandmystery_events e join starts s using(run_id)
), runs as (
  select run_id, min(player_id::text) as player, max(active_ms) as active_ms,
    bool_or(kind = 'ending') as finished, max(occurred_at) as last_seen
  from events group by run_id
), latest as (
  select distinct on (run_id) run_id, checkpoint, scene, line
  from events order by run_id, seq desc
), checkpoints as (
  select checkpoint, min(scene) as scene, count(distinct run_id) as reached
  from events group by checkpoint
), stops as (
  select l.checkpoint, min(l.scene) as scene, count(*) as unfinished,
    count(*) filter (where r.last_seen < now() - interval '7 days') as inactive
  from runs r join latest l using(run_id) where not r.finished group by l.checkpoint
), endings as (
  select ending, count(distinct run_id) as runs from events where kind = 'ending' group by ending
), choices as (
  select choice, count(distinct run_id) as runs from events where kind = 'choice' group by choice
), daily as (
  select (s.started_at at time zone 'UTC')::date as day, count(*) as starts,
    count(*) filter (where r.finished) as finishes
  from starts s join runs r using(run_id) group by 1
)
select jsonb_build_object(
  'as_of', now(),
  'totals', (select jsonb_build_object(
    'starts', count(*), 'players', count(distinct player),
    'finished', count(*) filter (where finished),
    'completion_rate', coalesce(round(100.0 * count(*) filter (where finished) / nullif(count(*), 0), 1), 0),
    'median_active_ms', coalesce(percentile_cont(.5) within group (order by active_ms), 0),
    'median_finished_ms', coalesce(percentile_cont(.5) within group (order by active_ms) filter (where finished), 0),
    'inactive', count(*) filter (where not finished and last_seen < now() - interval '7 days')
  ) from runs),
  'checkpoints', coalesce((select jsonb_agg(to_jsonb(c) order by reached desc, checkpoint) from checkpoints c), '[]'::jsonb),
  'stops', coalesce((select jsonb_agg(to_jsonb(s) order by unfinished desc, checkpoint) from stops s), '[]'::jsonb),
  'endings', coalesce((select jsonb_agg(to_jsonb(e) order by runs desc) from endings e), '[]'::jsonb),
  'choices', coalesce((select jsonb_agg(to_jsonb(c) order by runs desc) from choices c), '[]'::jsonb),
  'daily', coalesce((select jsonb_agg(to_jsonb(d) order by day) from daily d), '[]'::jsonb),
  'versions', coalesce((select jsonb_agg(to_jsonb(v) order by v.created_at desc nulls last, v.version desc) from (
    select coalesce(c.version, e.version) as version, c.description, c.created_at
    from public.bandmystery_versions c full join (
      select distinct version from public.bandmystery_events where kind = 'start'
    ) e on e.version = c.version
  ) v), '[]'::jsonb)
);
$$;
revoke all on function public.bandmystery_summary(integer, text) from public, anon, authenticated;
grant execute on function public.bandmystery_summary(integer, text) to service_role;
