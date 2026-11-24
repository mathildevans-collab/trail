-- Cadenzo: verrouiller les tables internes et indexer la FK des efforts.
-- Les Edge Functions utilisent service_role (BYPASSRLS). Aucun client web ne doit accéder à ces tables.
create policy "deny_client_access" on public.cadenzo_oauth_states
  for all to anon, authenticated using (false) with check (false);
create policy "deny_client_access" on public.cadenzo_strava_accounts
  for all to anon, authenticated using (false) with check (false);
create policy "deny_client_access" on public.cadenzo_strava_api_state
  for all to anon, authenticated using (false) with check (false);
create policy "deny_client_access" on public.cadenzo_sync
  for all to anon, authenticated using (false) with check (false);

-- Index couvrant la FK composite (user_id, strava_activity_id).
create index if not exists cadenzo_segment_efforts_user_activity_idx
  on public.cadenzo_segment_efforts (user_id, strava_activity_id);

-- Le RPC de synchro sans compte reste réservé au rôle anon.
-- L'accès authenticated et PUBLIC est explicitement retiré.
revoke all on function public.cadenzo_get(text) from public, authenticated;
revoke all on function public.cadenzo_put(text, jsonb) from public, authenticated;
grant execute on function public.cadenzo_get(text) to anon;
grant execute on function public.cadenzo_put(text, jsonb) to anon;
