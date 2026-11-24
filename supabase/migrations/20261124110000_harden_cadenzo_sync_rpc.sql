-- Cadenzo: durcissement des RPC de synchronisation sans compte.
-- Le client utilise volontairement le rôle anon et chiffre le document sur l'appareil.
-- Les fonctions restent donc appelables par anon, mais pas par PUBLIC/authenticated.

create or replace function public.cadenzo_get(p_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if p_id is null or p_id !~ '^[A-Za-z0-9_-]{20,80}$' then
    raise exception 'Invalid sync identifier' using errcode = '22023';
  end if;

  return (
    select s.env
    from public.cadenzo_sync as s
    where s.id = p_id
  );
end;
$function$;

create or replace function public.cadenzo_put(p_id text, p_env jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if p_id is null or p_id !~ '^[A-Za-z0-9_-]{20,80}$' then
    raise exception 'Invalid sync identifier' using errcode = '22023';
  end if;

  if p_env is null
     or pg_catalog.jsonb_typeof(p_env) is distinct from 'object'
     or p_env->>'cadenzo' is distinct from 'sync'
     or p_env->>'v' is distinct from '1'
     or not coalesce(p_env->>'iv' ~ '^[A-Za-z0-9+/]{16}$', false)
     or not coalesce(p_env->>'ct' ~ '^[A-Za-z0-9+/]+={0,2}$', false)
     or pg_catalog.length(p_env->>'ct') < 24
     or pg_catalog.length(p_env->>'ct') > 1500000
     or pg_catalog.pg_column_size(p_env) >= 2000000 then
    raise exception 'Invalid encrypted sync envelope' using errcode = '22023';
  end if;

  insert into public.cadenzo_sync (id, env)
  values (p_id, p_env)
  on conflict (id) do update
    set env = excluded.env,
        updated_at = pg_catalog.now();
end;
$function$;

revoke all on function public.cadenzo_get(text) from public, anon, authenticated;
revoke all on function public.cadenzo_put(text, jsonb) from public, anon, authenticated;
grant execute on function public.cadenzo_get(text) to anon;
grant execute on function public.cadenzo_put(text, jsonb) to anon;
