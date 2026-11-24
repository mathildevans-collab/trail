"use strict";
const fs = require("node:fs");
const assert = require("node:assert/strict");

const migration = fs.readFileSync(
  "supabase/migrations/20261124094203_harden_cadenzo_sync_rpc.sql",
  "utf8"
).toLowerCase();
const base = fs.readFileSync("supabase/cadenzo_sync.sql", "utf8").toLowerCase();

// Les RPC restent compatibles avec csync.js (appel sans session Supabase).
assert.ok(migration.includes("function public.cadenzo_get(text)"));
assert.ok(migration.includes("function public.cadenzo_put(p_id text, p_env jsonb)"));
assert.match(migration, /security definer/);
assert.match(migration, /set search_path = ''/);
assert.match(migration, /revoke all on function public\.cadenzo_get\(text\) from public, anon, authenticated/);
assert.match(migration, /revoke all on function public\.cadenzo_put\(text, jsonb\) from public, anon, authenticated/);
assert.match(migration, /grant execute on function public\.cadenzo_get\(text\) to anon/);
assert.match(migration, /grant execute on function public\.cadenzo_put\(text, jsonb\) to anon/);
assert.match(migration, /invalid sync identifier/);
assert.match(migration, /invalid encrypted sync envelope/);
assert.match(migration, /pg_catalog\.pg_column_size/);

// Le schéma d'origine continue de chiffrer côté appareil et interdit l'accès direct à la table.
assert.match(base, /alter table public\.cadenzo_sync enable row level security/);
assert.match(base, /revoke all on public\.cadenzo_sync from anon, authenticated/);
assert.match(fs.readFileSync("csync.js", "utf8"), /rpc\("cadenzo_get"/);
assert.match(fs.readFileSync("csync.js", "utf8"), /rpc\("cadenzo_put"/);

console.log("OK : garde-fous RPC Cadenzo et compatibilité client vérifiés.");
