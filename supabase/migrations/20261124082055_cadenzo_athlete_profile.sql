alter table public.cadenzo_training_preferences
  add column if not exists athlete_profile jsonb not null default '{}'::jsonb;

alter table public.cadenzo_training_preferences
  drop constraint if exists cadenzo_training_preferences_athlete_profile_object;

alter table public.cadenzo_training_preferences
  add constraint cadenzo_training_preferences_athlete_profile_object
  check (jsonb_typeof(athlete_profile) = 'object');
