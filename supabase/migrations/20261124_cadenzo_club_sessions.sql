alter table public.cadenzo_training_preferences
  add column if not exists club_sessions jsonb not null default '[]'::jsonb;

alter table public.cadenzo_training_preferences
  drop constraint if exists cadenzo_club_name_required;

alter table public.cadenzo_training_preferences
  add constraint cadenzo_club_sessions_array
  check (jsonb_typeof(club_sessions) = 'array');
