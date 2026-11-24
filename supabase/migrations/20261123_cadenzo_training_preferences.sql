create table if not exists public.cadenzo_training_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  has_club boolean not null default false,
  club_name text,
  club_days smallint[] not null default '{}',
  sessions_per_week smallint not null default 4 check (sessions_per_week between 2 and 7),
  training_days smallint[] not null default '{1,2,3,5,6}',
  rest_days smallint[] not null default '{0,4}',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cadenzo_club_name_required check (not has_club or nullif(trim(club_name),'') is not null),
  constraint cadenzo_training_days_valid check (training_days <@ array[0,1,2,3,4,5,6]::smallint[]),
  constraint cadenzo_rest_days_valid check (rest_days <@ array[0,1,2,3,4,5,6]::smallint[]),
  constraint cadenzo_club_days_valid check (club_days <@ array[0,1,2,3,4,5,6]::smallint[] and club_days <@ training_days),
  constraint cadenzo_day_sets_disjoint check (not (training_days && rest_days)),
  constraint cadenzo_training_day_count check (cardinality(training_days) >= sessions_per_week)
);
alter table public.cadenzo_training_preferences enable row level security;
drop policy if exists cadenzo_training_preferences_select_own on public.cadenzo_training_preferences;
create policy cadenzo_training_preferences_select_own on public.cadenzo_training_preferences for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists cadenzo_training_preferences_insert_own on public.cadenzo_training_preferences;
create policy cadenzo_training_preferences_insert_own on public.cadenzo_training_preferences for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists cadenzo_training_preferences_update_own on public.cadenzo_training_preferences;
create policy cadenzo_training_preferences_update_own on public.cadenzo_training_preferences for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 2026-11-24 : droits d'accès (la RLS ci-dessus reste le garde-fou)
grant select, insert, update on public.cadenzo_training_preferences to authenticated;
revoke truncate, references, trigger on public.cadenzo_training_preferences from anon, authenticated;

-- 2026-11-24 : profils existants = « legacy » (ni onboarding ni plan modifié)
alter table public.cadenzo_training_preferences add column if not exists legacy boolean not null default false;
insert into public.cadenzo_training_preferences (user_id, onboarding_completed, legacy)
select p.user_id, true, true from public.cadenzo_profiles p
on conflict (user_id) do nothing;
