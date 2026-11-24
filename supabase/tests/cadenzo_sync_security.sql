-- Test d'intégration manuel à exécuter sur une base de test Supabase.
-- Toutes les écritures sont annulées à la fin du test.
begin;

do $$
begin
  if not has_function_privilege('anon', 'public.cadenzo_get(text)', 'EXECUTE')
     or not has_function_privilege('anon', 'public.cadenzo_put(text, jsonb)', 'EXECUTE') then
    raise exception 'anon must be able to call the Cadenzo sync RPCs';
  end if;
  if has_function_privilege('authenticated', 'public.cadenzo_get(text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.cadenzo_put(text, jsonb)', 'EXECUTE') then
    raise exception 'authenticated must not be able to call anonymous sync RPCs';
  end if;
  if has_table_privilege('anon', 'public.cadenzo_sync', 'SELECT')
     or has_table_privilege('anon', 'public.cadenzo_sync', 'INSERT')
     or has_table_privilege('authenticated', 'public.cadenzo_sync', 'SELECT')
     or has_table_privilege('authenticated', 'public.cadenzo_sync', 'INSERT') then
    raise exception 'Direct access to cadenzo_sync must remain revoked';
  end if;
end;
$$;

set local role anon;
select public.cadenzo_put(
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  '{"cadenzo":"sync","v":1,"iv":"AAAAAAAAAAAAAAAA","ct":"AAAAAAAAAAAAAAAAAAAAAAAA"}'::jsonb
);

do $$
declare
  actual jsonb;
begin
  actual := public.cadenzo_get('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  if actual is distinct from
     '{"cadenzo":"sync","v":1,"iv":"AAAAAAAAAAAAAAAA","ct":"AAAAAAAAAAAAAAAAAAAAAAAA"}'::jsonb then
    raise exception 'Cadenzo sync RPC round-trip failed';
  end if;
  begin
    perform public.cadenzo_get('invalid');
    raise exception 'Invalid identifier was unexpectedly accepted';
  exception when sqlstate '22023' then
    null;
  end;
  begin
    perform public.cadenzo_put(
      'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
      '{"cadenzo":"wrong","v":1,"iv":"AAAAAAAAAAAAAAAA","ct":"AAAAAAAAAAAAAAAAAAAAAAAA"}'::jsonb
    );
    raise exception 'Invalid envelope was unexpectedly accepted';
  exception when sqlstate '22023' then
    null;
  end;
end;
$$;

reset role;
rollback;
