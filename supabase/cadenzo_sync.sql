-- Cadenzo · stockage de la synchro entre appareils (à lancer une fois dans Supabase › SQL Editor).
-- La table ne contient que des données déjà chiffrées sur l'appareil. Personne ne peut la lister :
-- on ne lit ou n'écrit une ligne qu'en connaissant son identifiant (aléatoire, dans le code de liaison).
create table if not exists public.cadenzo_sync (
  id text primary key check (length(id) between 20 and 80),
  env jsonb not null check (pg_column_size(env) < 2000000),
  updated_at timestamptz not null default now()
);
alter table public.cadenzo_sync enable row level security;
revoke all on public.cadenzo_sync from anon, authenticated;

create or replace function public.cadenzo_get(p_id text) returns jsonb
language sql security definer set search_path = public as $$
  select env from cadenzo_sync where id = p_id $$;

create or replace function public.cadenzo_put(p_id text, p_env jsonb) returns void
language sql security definer set search_path = public as $$
  insert into cadenzo_sync(id, env) values (p_id, p_env)
  on conflict (id) do update set env = excluded.env, updated_at = now() $$;

revoke execute on function public.cadenzo_get(text), public.cadenzo_put(text, jsonb) from public;
grant execute on function public.cadenzo_get(text), public.cadenzo_put(text, jsonb) to anon, authenticated;
