-- DKK v1.0 Pilot altyapısı
-- Pilot verileri ana responses tablosundan tamamen ayrıdır.

create sequence if not exists public.pilot_v1_participant_code_seq
  increment by 1 minvalue 1 start with 14;

create table if not exists public.pilot_v1_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  participant_code text not null,
  grade smallint not null check (grade between 9 and 12),
  site_code text not null default 'OKUL-A',
  device_class text not null check (device_class in ('mobile','tablet','desktop')),
  scenario_id text not null,
  order_no smallint not null check (order_no between 1 and 30),
  defender_count smallint not null check (defender_count between 0 and 4),
  peer_total smallint not null default 4 check (peer_total = 4),
  allocation_group smallint check (allocation_group between 0 and 4),
  decision text not null check (decision in ('support_aggressor','silent','private_support','public_defend','report')),
  decision_kind text not null check (decision_kind in ('destek','pasif','aktif')),
  rt_ms integer not null check (rt_ms >= 0),
  study_phase text not null default 'pilot',
  app_version text not null default 'dkk-v1.0-pilot',
  condition_version text not null default 'fixed-peer-4',
  client_timestamp timestamptz,
  created_at timestamptz not null default now(),
  unique(session_id, scenario_id)
);

create table if not exists public.pilot_v1_session_meta (
  session_id uuid primary key,
  participant_code text not null,
  grade smallint not null check (grade between 9 and 12),
  site_code text not null default 'OKUL-A',
  device_class text not null check (device_class in ('mobile','tablet','desktop')),
  total_duration_ms integer not null check (total_duration_ms >= 0),
  allocation_group smallint check (allocation_group between 0 and 4),
  awareness_guess text,
  completed_at timestamptz not null default now(),
  app_version text not null default 'dkk-v1.0-pilot'
);

alter table public.pilot_v1_responses enable row level security;
alter table public.pilot_v1_session_meta enable row level security;

drop policy if exists "anon can insert pilot v1 responses" on public.pilot_v1_responses;
create policy "anon can insert pilot v1 responses"
on public.pilot_v1_responses for insert to anon with check (true);

drop policy if exists "researcher can read pilot v1 responses" on public.pilot_v1_responses;
create policy "researcher can read pilot v1 responses"
on public.pilot_v1_responses for select to authenticated
using (auth.uid() = 'c96c7289-47c9-4965-84db-fd39837a95fa'::uuid);

drop policy if exists "anon can insert pilot v1 session meta" on public.pilot_v1_session_meta;
create policy "anon can insert pilot v1 session meta"
on public.pilot_v1_session_meta for insert to anon with check (true);

drop policy if exists "researcher can read pilot v1 session meta" on public.pilot_v1_session_meta;
create policy "researcher can read pilot v1 session meta"
on public.pilot_v1_session_meta for select to authenticated
using (auth.uid() = 'c96c7289-47c9-4965-84db-fd39837a95fa'::uuid);

grant insert on public.pilot_v1_responses to anon;
grant insert on public.pilot_v1_session_meta to anon;
grant select on public.pilot_v1_responses to authenticated;
grant select on public.pilot_v1_session_meta to authenticated;

create or replace function public.next_pilot_v1_participant_code()
returns text
language sql
security definer
set search_path = public
as $$
  select 'K' || lpad(nextval('public.pilot_v1_participant_code_seq')::text, 3, '0');
$$;

revoke all on function public.next_pilot_v1_participant_code() from public;
grant execute on function public.next_pilot_v1_participant_code() to anon, authenticated;

create or replace function public.reset_pilot_v1_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is distinct from 'c96c7289-47c9-4965-84db-fd39837a95fa'::uuid then
    raise exception 'Yetkisiz işlem';
  end if;
  delete from public.pilot_v1_session_meta;
  delete from public.pilot_v1_responses;
  perform setval('public.pilot_v1_participant_code_seq', 13, true);
end;
$$;

revoke all on function public.reset_pilot_v1_data() from public;
grant execute on function public.reset_pilot_v1_data() to authenticated;