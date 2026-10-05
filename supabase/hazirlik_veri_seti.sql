-- Dijital Kritik Kütle - Hazırlık veri seti
-- Bu tablo gerçek öğrenci katılımından üretilmeyen, panel/analiz/rapor akışını
-- teknik olarak doğrulamak için kullanılan ayrı veri setidir.
-- Ana public.responses tablosuna dokunmaz.

create table if not exists public.prepared_responses (
  id text primary key,
  session_id text not null,
  participant_code text not null,
  grade smallint not null check (grade between 9 and 12),
  scenario_id text not null,
  order_no integer not null,
  defender_count integer not null check (defender_count between 0 and 4),
  decision text not null,
  decision_kind text not null,
  rt_ms integer not null,
  study_phase text not null default 'main',
  app_version text not null default 'prepared-v1',
  client_timestamp timestamptz not null,
  created_at timestamptz not null,
  data_origin text not null default 'prepared'
);

alter table public.prepared_responses enable row level security;

drop policy if exists "authenticated researcher can read prepared responses"
on public.prepared_responses;

create policy "authenticated researcher can read prepared responses"
on public.prepared_responses
for select
to authenticated
using (auth.uid() is not null);

grant select on public.prepared_responses to authenticated;
revoke all on public.prepared_responses from anon;

truncate table public.prepared_responses;

with participants as (
  select
    i,
    (9 + floor(i / 60.0))::int as grade,
    'K' || lpad((14 + i)::text, 3, '0') as participant_code,
    'prep-session-' || lpad((i + 1)::text, 3, '0') as session_id,
    (
      timestamptz '2026-09-03 08:00:00+03'
      + (((i * 7 + floor(i / 9.0)::int) % 24) || ' days')::interval
      + (((i * 3) % 8) || ' hours')::interval
      + (((i * 11) % 60) || ' minutes')::interval
    ) as session_start
  from generate_series(0,239) i
),
base as (
  select
    p.*,
    s as scenario_idx,
    ((s + p.i) % 5)::int as defender_count,
    row_number() over (
      partition by p.i
      order by hashtextextended((p.i::text || '-' || s::text), 90421)
    )::int as order_no,
    (
      mod(abs(hashtextextended((p.i::text || '-' || s::text || '-decision'), 71237)),1000000)::numeric
      / 1000000
    ) as r01,
    (
      mod(abs(hashtextextended((p.i::text || '-' || s::text || '-rt'), 55109)),1000000)::numeric
      / 1000000
    ) as rr
  from participants p
  cross join generate_series(0,29) s
),
scored as (
  select *,
    case defender_count
      when 0 then 0.13
      when 1 then 0.10
      when 2 then 0.07
      when 3 then 0.04
      else 0.03
    end as p_support,
    case defender_count
      when 0 then 0.39
      when 1 then 0.33
      when 2 then 0.26
      when 3 then 0.16
      else 0.12
    end
    - case grade when 9 then -0.02 when 10 then -0.01 when 11 then 0.01 else 0.02 end
    as p_silent,
    case defender_count
      when 0 then 0.22
      when 1 then 0.21
      when 2 then 0.19
      when 3 then 0.14
      else 0.11
    end as p_private,
    case defender_count
      when 0 then 0.18
      when 1 then 0.25
      when 2 then 0.37
      when 3 then 0.58
      else 0.65
    end
    + case grade when 9 then -0.02 when 10 then -0.01 when 11 then 0.01 else 0.02 end
    as p_public,
    case defender_count
      when 0 then 10800
      when 1 then 10400
      when 2 then 11100
      when 3 then 9200
      else 8600
    end as rt_mean
  from base
),
decided as (
  select *,
    case
      when r01 < p_support then 'support_aggressor'
      when r01 < p_support + p_silent then 'silent'
      when r01 < p_support + p_silent + p_private then 'private_support'
      when r01 < p_support + p_silent + p_private + p_public then 'public_defend'
      else 'report'
    end as decision,
    greatest(2600, round(rt_mean + (rr - 0.5) * 5200)::int) as rt_ms
  from scored
),
final_rows as (
  select *,
    session_start
      + ((order_no - 1) * interval '14 seconds')
      + (rt_ms * interval '1 millisecond') as event_time
  from decided
)
insert into public.prepared_responses (
  id,session_id,participant_code,grade,scenario_id,order_no,defender_count,
  decision,decision_kind,rt_ms,study_phase,app_version,client_timestamp,created_at,data_origin
)
select
  'prep-' || lpad((i + 1)::text,3,'0') || '-' || lpad(order_no::text,2,'0'),
  session_id,
  participant_code,
  grade,
  'S' || lpad((scenario_idx + 1)::text,2,'0'),
  order_no,
  defender_count,
  decision,
  case
    when decision='support_aggressor' then 'destek'
    when decision='silent' then 'pasif'
    else 'aktif'
  end,
  rt_ms,
  'main',
  'prepared-v1',
  event_time,
  event_time,
  'prepared'
from final_rows
order by i,order_no;

-- Karar sürelerini dengeli ve yeniden üretilebilir hale getir.
-- Genel ortalama tam olarak 11,27 sn olur.
with ranked_rt as (
  select
    id,
    defender_count,
    row_number() over (
      partition by defender_count
      order by participant_code, scenario_id, order_no
    ) as rn
  from public.prepared_responses
)
update public.prepared_responses p
set rt_ms =
  case r.defender_count
    when 0 then 12200
    when 1 then 11900
    when 2 then 12500
    when 3 then 10500
    when 4 then 9250
  end
  + (((r.rn - 1) % 45) - 22) * 100
from ranked_rt r
where p.id = r.id;

-- Kontrol sorguları
select count(distinct session_id) as katilimci, count(*) as karar
from public.prepared_responses;

select grade, count(distinct session_id) as katilimci
from public.prepared_responses
group by grade
order by grade;

select defender_count,
       round(100.0 * count(*) filter (where decision='public_defend') / count(*),1) as kamusal_savunma_yuzde
from public.prepared_responses
group by defender_count
order by defender_count;
