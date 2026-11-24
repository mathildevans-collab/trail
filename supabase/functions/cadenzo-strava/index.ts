import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRAVA_CLIENT_ID = (Deno.env.get("STRAVA_CLIENT_ID") || "294306").trim();
const STRAVA_CLIENT_SECRET = Deno.env.get("STRAVA_CLIENT_SECRET") || "";
const ENCRYPTION_KEY = Deno.env.get("STRAVA_TOKEN_ENCRYPTION_KEY") || "";
const APP_ORIGIN = "https://mathildevans-collab.github.io";
const APP_BASE_URL = "https://mathildevans-collab.github.io/trail";
const REDIRECT_URI = SUPABASE_URL + "/functions/v1/cadenzo-strava";
const COOKIE = "cadenzo_oauth";
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const cors = {
  "Access-Control-Allow-Origin": APP_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Vary": "Origin"
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" }
});
const redirect = (url: string, cookie?: string) => {
  const h = new Headers({ Location: url, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
  if (cookie) h.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers: h });
};
const clearCookie = COOKIE + "=; Max-Age=0; Path=/functions/v1/cadenzo-strava; HttpOnly; Secure; SameSite=Lax";
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function cryptoKey() {
  if (!ENCRYPTION_KEY) throw new Error("STRAVA_TOKEN_ENCRYPTION_KEY manquant");
  const raw = unb64(ENCRYPTION_KEY);
  if (raw.length !== 32) throw new Error("STRAVA_TOKEN_ENCRYPTION_KEY doit contenir 32 octets encodés en base64");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function encrypt(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await cryptoKey(), new TextEncoder().encode(value));
  return b64(new Uint8Array([...iv, ...new Uint8Array(cipher)]));
}
async function decrypt(value: string) {
  const packed = unb64(value);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: packed.slice(0, 12) }, await cryptoKey(), packed.slice(12));
  return new TextDecoder().decode(plain);
}
class StravaRateLimitError extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super("Strava 429: limite API atteinte");
    this.name = "StravaRateLimitError";
    this.retryAfterSeconds = Math.max(60, retryAfterSeconds);
  }
}
async function strava(path: string, token?: string, init: RequestInit = {}) {
  const r = await fetch("https://www.strava.com/api/v3" + path, {
    ...init, headers: { ...(init.headers || {}), ...(token ? { Authorization: "Bearer " + token } : {}) }
  });
  const data = await r.json().catch(() => ({}));
  if (r.status === 429) {
    const retryHeader = Number(r.headers.get("Retry-After") || 0);
    const usage = (r.headers.get("X-RateLimit-Usage") || "").split(",").map((v) => Number(v.trim()));
    const limits = (r.headers.get("X-RateLimit-Limit") || "").split(",").map((v) => Number(v.trim()));
    const dailyExceeded = usage.length > 1 && limits.length > 1 && usage[1] >= limits[1] && limits[1] > 0;
    let retrySeconds = retryHeader > 0 ? retryHeader : 15 * 60;
    if (dailyExceeded && retryHeader <= 0) {
      const nextUtcDay = new Date();
      nextUtcDay.setUTCHours(24, 1, 0, 0);
      retrySeconds = Math.max(retrySeconds, Math.ceil((nextUtcDay.getTime() - Date.now()) / 1000));
    }
    throw new StravaRateLimitError(retrySeconds);
  }
  if (!r.ok) throw new Error("Strava " + r.status + ": " + (data.message || data.errors?.[0]?.message || "requête refusée"));
  return data;
}
async function exchange(body: Record<string, string>) {
  const r = await fetch("https://www.strava.com/oauth/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: STRAVA_CLIENT_ID, client_secret: STRAVA_CLIENT_SECRET, ...body })
  });
  const data = await r.json();
  if (!r.ok) throw new Error("Échange OAuth Strava refusé: " + (data.message || r.status));
  return data;
}
function safeReturn(message: string) {
  return APP_BASE_URL + "/?strava_error=" + encodeURIComponent(message.slice(0, 180));
}
function readCookie(req: Request, name: string) {
  const m = (req.headers.get("Cookie") || "").split(";").map((c) => c.trim()).find((c) => c.startsWith(name + "="));
  return m ? m.slice(name.length + 1) : "";
}
async function callback(req: Request, url: URL) {
  const state = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  if (!state || !code || url.searchParams.get("error")) return redirect(safeReturn("Autorisation Strava annulée."), clearCookie);
  // Le « state » doit aussi correspondre au cookie posé dans CE navigateur au départ :
  // empêche de faire ouvrir à quelqu'un un lien de connexion préparé par un tiers.
  const cookieState = readCookie(req, COOKIE);
  if (!cookieState || cookieState !== state) return redirect(safeReturn("Demande de connexion invalide. Réessaie depuis l’application."), clearCookie);
  const { data: saved, error: stateErr } = await admin.from("cadenzo_oauth_states").select("state").eq("state", state).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (stateErr || !saved) return redirect(safeReturn("Demande de connexion expirée. Réessaie."), clearCookie);
  await admin.from("cadenzo_oauth_states").delete().eq("state", state);
  // Strava renvoie les droits réellement accordés : l'activité complète est indispensable.
  const granted = (url.searchParams.get("scope") || "").split(",").map((s) => s.trim());
  if (!granted.includes("activity:read_all")) return redirect(safeReturn("Autorise l’accès à tes activités sur Strava pour utiliser Cadenzo."), clearCookie);
  const token = await exchange({ code, grant_type: "authorization_code", redirect_uri: REDIRECT_URI });
  const athlete = token.athlete || {};
  if (!athlete.id) return redirect(safeReturn("Profil Strava introuvable."), clearCookie);
  const email = "strava-" + athlete.id + "@accounts.cadenzo.invalid";
  let userId: string | null = null;
  const { data: existing } = await admin.from("cadenzo_profiles").select("user_id").eq("strava_athlete_id", athlete.id).maybeSingle();
  if (existing?.user_id) userId = existing.user_id;
  // Cadenzo limite volontairement son accès à 10 athlètes connectés.
  // Une reconnexion d'un athlète existant reste autorisée.
  if (!userId) {
    const { count, error: countErr } = await admin.from("cadenzo_strava_accounts").select("user_id", { count: "exact", head: true });
    if (countErr) throw countErr;
    if ((count ?? 0) >= 10) return redirect(safeReturn("Cadenzo a atteint sa limite de 10 athlètes connectés."), clearCookie);
  }
  if (!userId) {
    const { data: created, error } = await admin.auth.admin.createUser({
      email, email_confirm: true, user_metadata: { provider: "strava", strava_athlete_id: athlete.id }
    });
    if (error) throw error;
    userId = created.user.id;
  }
  const [accessEnc, refreshEnc] = await Promise.all([encrypt(token.access_token), encrypt(token.refresh_token)]);
  const { error: profileErr } = await admin.from("cadenzo_profiles").upsert({
    user_id: userId, strava_athlete_id: athlete.id,
    display_name: [athlete.firstname, athlete.lastname].filter(Boolean).join(" "),
    username: athlete.username || null, profile_picture: athlete.profile || athlete.profile_medium || null,
    updated_at: new Date().toISOString()
  });
  if (profileErr) throw profileErr;
  const { error: tokenErr } = await admin.from("cadenzo_strava_accounts").upsert({
    user_id: userId, access_token_enc: accessEnc, refresh_token_enc: refreshEnc,
    expires_at: token.expires_at, scopes: granted,
    updated_at: new Date().toISOString()
  });
  if (tokenErr) throw tokenErr;
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (linkErr || !link?.properties?.hashed_token) throw linkErr || new Error("Lien de session non généré");
  const target = new URL(APP_BASE_URL + "/");
  target.searchParams.set("token_hash", link.properties.hashed_token);
  target.searchParams.set("type", "magiclink");
  return redirect(target.toString(), clearCookie);
}
class StravaReauthError extends Error {
  constructor() {
    super("La connexion Strava doit être renouvelée. Reconnecte ton compte pour continuer.");
    this.name = "StravaReauthError";
  }
}
async function getAccessToken(userId: string) {
  const { data: account, error } = await admin.from("cadenzo_strava_accounts").select("*").eq("user_id", userId).single();
  if (error || !account || !account.access_token_enc || !account.refresh_token_enc || !account.expires_at) throw new StravaReauthError();
  if (Number(account.expires_at) <= Math.floor(Date.now() / 1000) + 300) {
    try {
      const refresh = await decrypt(account.refresh_token_enc);
      const next = await exchange({ grant_type: "refresh_token", refresh_token: refresh });
      if (!next.access_token || !next.refresh_token || !next.expires_at) throw new Error("Réponse OAuth incomplète");
      const [a, b] = await Promise.all([encrypt(next.access_token), encrypt(next.refresh_token)]);
      const { error: updateErr } = await admin.from("cadenzo_strava_accounts").update({
        access_token_enc: a, refresh_token_enc: b, expires_at: next.expires_at, updated_at: new Date().toISOString()
      }).eq("user_id", userId);
      if (updateErr) throw updateErr;
      return next.access_token;
    } catch (err) {
      console.error("Strava token refresh failed:", err instanceof Error ? err.message : "unknown");
      throw new StravaReauthError();
    }
  }
  return await decrypt(account.access_token_enc);
}
async function findSegments(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Session requise." }, 401);

  const body = await req.json().catch(() => ({}));
  const lat = Number(body.lat), lng = Number(body.lng);
  const radiusKm = Math.max(1, Math.min(8, Number(body.radiusKm) || 5));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return json({ error: "Position GPS invalide." }, 400);
  }

  // Vérifie le JWT utilisateur via Auth avec le client serveur déjà configuré.
  // Évite de dépendre d'une variable SUPABASE_ANON_KEY non garantie dans l'environnement Edge.
  const { data: { user }, error } = await admin.auth.getUser(jwt);
  if (error || !user) return json({ error: "Session invalide." }, 401);

  // Recherche exclusivement dans le catalogue Cadenzo : aucun appel à l'API Strava.
  // Les segments sont mutualisés entre les comptes, car leurs métadonnées décrivent
  // des segments publics et non les activités privées des contributeurs.
  const { data: rows, error: rowsErr } = await admin.from("cadenzo_segments")
    .select("strava_segment_id,name,distance,average_grade,elevation_high,elevation_low,city,raw")
    .limit(5000);
  if (rowsErr) throw rowsErr;

  const distanceKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
    const dy = (aLat - bLat) * 111;
    const dx = (aLng - bLng) * 111 * Math.cos(lat * Math.PI / 180);
    return Math.sqrt(dx * dx + dy * dy);
  };

  const unique = new Map<number, any>();
  for (const s of rows || []) {
    const id = Number(s.strava_segment_id);
    if (!id) continue;
    const start = s.raw?.start_latlng || [];
    const sLat = Number(start[0]), sLng = Number(start[1]);
    if (!Number.isFinite(sLat) || !Number.isFinite(sLng) || Math.abs(sLat) > 90 || Math.abs(sLng) > 180) continue;
    const km = distanceKm(sLat, sLng, lat, lng);
    if (km > radiusKm) continue;

    const candidate = {
      i: id, n: String(s.name || "Segment"), d: Math.round(Number(s.distance || 0)),
      g: Math.round(Number(s.average_grade || 0) * 10) / 10,
      e: Math.round(Math.max(0, Number(s.elevation_high || 0) - Number(s.elevation_low || 0))),
      v: String(s.city || ""), la: sLat, ln: sLng, s: "e", _distanceKm: km
    };
    const previous = unique.get(id);
    if (!previous || candidate._distanceKm < previous._distanceKm) unique.set(id, candidate);
  }

  const items = Array.from(unique.values())
    .sort((a: any, b: any) => a._distanceKm - b._distanceKm)
    .map(({ _distanceKm, ...item }: any) => item);

  return json({
    items, count: items.length, radiusKm, source: "cadenzo_saved_segments",
    searchedAt: new Date().toISOString()
  });
}

async function getClimbSegments(userId: string) {
  const { data, error } = await admin.from("cadenzo_segments")
    .select("strava_segment_id,name,distance,average_grade,elevation_high,elevation_low,city,raw")
    .eq("user_id", userId)
    .gte("distance", 100).lte("distance", 800)
    .gte("average_grade", 4)
    .order("average_grade", { ascending: false }).limit(50);
  if (error) throw error;
  return (data || []).map((s: any) => {
    const raw = s.raw || {};
    const start = raw.start_latlng || [];
    const e = Math.max(0, Number(s.elevation_high || 0) - Number(s.elevation_low || 0));
    return { i: Number(s.strava_segment_id), n: String(s.name || "Segment"),
      d: Math.round(Number(s.distance || 0)), g: Math.round(Number(s.average_grade || 0) * 10) / 10,
      e: Math.round(e), v: String(s.city || ""), la: Number(start[0] || 0), ln: Number(start[1] || 0), s: "e" };
  }).filter((s: any) => s.i && s.la && s.ln && s.e >= 8);
}

async function sync(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Session requise." }, 401);
  const anon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "", { auth: { persistSession: false } });
  const { data: { user }, error } = await anon.auth.getUser(jwt);
  if (error || !user) return json({ error: "Session invalide." }, 401);

  const { data: account, error: accountErr } = await admin.from("cadenzo_strava_accounts")
    .select("last_sync_at,sync_retry_after,sync_lock_until").eq("user_id", user.id).single();
  if (accountErr || !account) return json({ error: "Compte Strava non associé." }, 404);

  const now = Date.now();
  const lastSyncAt = account.last_sync_at ? Date.parse(account.last_sync_at) : 0;
  const { data: pendingDetailRows, error: pendingDetailErr } = await admin.from("cadenzo_activities")
    .select("strava_activity_id,name,sport_type,distance,moving_time,elapsed_time,total_elevation_gain,start_date,summary_polyline,raw").eq("user_id", user.id).order("start_date", { ascending: true }).limit(200);
  if (pendingDetailErr) throw pendingDetailErr;
  const hasPendingDetails = (pendingDetailRows || []).some((x: any) => {
    const meta = x.raw || {};
    return !meta.details_checked_at && Number(meta.detail_retry_after || 0) <= now;
  });

  // Cache serveur de 5 min : plusieurs ouvertures/appareils ne relancent pas Strava inutilement.
  if (lastSyncAt && now - lastSyncAt < 5 * 60 * 1000 && !hasPendingDetails) {
    const { data: cached, error: cacheErr } = await admin.from("cadenzo_activities")
      .select("strava_activity_id,start_date,distance,total_elevation_gain,moving_time,raw")
      .eq("user_id", user.id).gte("start_date", "2026-01-01T00:00:00Z").order("start_date", { ascending: true });
    if (cacheErr) throw cacheErr;
    const runs = (cached || []).map((a: any) => ({
      id: a.strava_activity_id, date: String(a.start_date || "").slice(0, 10),
      km: Math.round(Number(a.distance || 0) / 10) / 100,
      dp: Math.round(Number(a.total_elevation_gain || 0)),
      t: Number(a.moving_time || 0), hr: Math.round(Number(a.raw?.average_heartrate || 0)),
      sg: Array.isArray(a.raw?.sg) ? a.raw.sg : [], be: Array.isArray(a.raw?.be) ? a.raw.be : []
    }));
    const cotes = await getClimbSegments(user.id);
    return json({ updated: account.last_sync_at, runs, cotes, cached: true });
  }
  const retryAt = account.sync_retry_after ? Date.parse(account.sync_retry_after) : 0;
  if (retryAt > now) {
    const seconds = Math.ceil((retryAt - now) / 1000);
    return json({ error: "Strava limite temporairement les synchronisations.", code: "STRAVA_RATE_LIMIT", retryAfter: seconds, retryAt: account.sync_retry_after }, 429);
  }
  // Verrou atomique : une seule synchronisation à la fois par utilisateur (la condition est évaluée par la base).
  const nowIso = new Date(now).toISOString();
  const { data: locked, error: lockErr } = await admin.from("cadenzo_strava_accounts").update({
    sync_lock_until: new Date(now + 4 * 60 * 1000).toISOString()
  }).eq("user_id", user.id).or("sync_lock_until.is.null,sync_lock_until.lt." + nowIso).select("user_id");
  if (lockErr) throw lockErr;
  if (!locked || !locked.length) return json({ error: "Une synchronisation est déjà en cours.", code: "SYNC_IN_PROGRESS", retryAfter: 30 }, 409);

  try {
    const access = await getAccessToken(user.id);
    const { data: latestRows, error: latestErr } = await admin.from("cadenzo_activities")
      .select("start_date").eq("user_id", user.id).order("start_date", { ascending: false }).limit(1);
    if (latestErr) throw latestErr;
    const latestDate = latestRows?.[0]?.start_date ? Date.parse(latestRows[0].start_date) : 0;
    // Recouvrement de 48 h pour récupérer les sorties importées tardivement ou modifiées.
    const after = latestDate ? Math.floor((latestDate - 48 * 60 * 60 * 1000) / 1000) : Math.floor(Date.parse("2026-01-01T00:00:00Z") / 1000);
    const all: any[] = [];
    for (let page = 1; page <= 10; page++) {
      const batch = await strava("/athlete/activities?after=" + after + "&per_page=100&page=" + page, access);
      if (!batch.length) break;
      all.push(...batch.filter((a: any) => ["Run", "TrailRun"].includes(a.sport_type) && a.distance > 0));
      if (batch.length < 100) break;
    }

    // Rattrapage progressif des détails historiques manquants (5 activités par synchronisation).
    // Cela reconstruit les segments et records sans relire tout l'historique auprès de Strava.
    const pendingRows = pendingDetailRows;
    const currentIds = new Set(all.map((a: any) => Number(a.id)));
    const backfill = (pendingRows || []).filter((x: any) => {
      const meta = x.raw || {};
      const missing = !meta.details_checked_at && (!Array.isArray(meta.sg) || !meta.sg.length || !Array.isArray(meta.be) || !meta.be.length);
      return missing && Number(meta.detail_retry_after || 0) <= Date.now() && !currentIds.has(Number(x.strava_activity_id));
    }).slice(0, 50).map((x: any) => ({
      id: Number(x.strava_activity_id), name: x.name, sport_type: x.sport_type,
      distance: Number(x.distance || 0), moving_time: Number(x.moving_time || 0),
      elapsed_time: Number(x.elapsed_time || 0), total_elevation_gain: Number(x.total_elevation_gain || 0),
      start_date: x.start_date, start_date_local: x.start_date, map: { summary_polyline: x.summary_polyline || null }
    }));
    all.unshift(...backfill);

    const ids = all.map((a: any) => a.id);
    const { data: old, error: oldErr } = await admin.from("cadenzo_activities")
      .select("strava_activity_id,raw").eq("user_id", user.id).in("strava_activity_id", ids.length ? ids : [-1]);
    if (oldErr) throw oldErr;
    const previous = new Map((old || []).map((x: any) => [Number(x.strava_activity_id), x.raw || {}]));
    const runs: any[] = [];
    const activities: any[] = [];
    const segmentRows: any[] = [];
    const effortRows: any[] = [];
    let detailedCount = 0;

    for (const a of all) {
      const prev: any = previous.get(Number(a.id)) || {};
      let sg = Array.isArray(prev.sg) ? prev.sg : [];
      let be = Array.isArray(prev.be) ? prev.be : [];
      let detailsCheckedAt = prev.details_checked_at || null;
      let detailRetryAfter = Number(prev.detail_retry_after || 0);
      // Marque aussi les activités sans segments/records pour éviter de les reconsulter à chaque passage.
      if (!detailsCheckedAt && (!sg.length || !be.length) && detailRetryAfter <= Date.now() && detailedCount < 50) {
        detailedCount++;
        try {
          const detail: any = await strava("/activities/" + a.id + "?include_all_efforts=true", access);
          sg = (detail.segment_efforts || []).map((effort: any) => {
            const seg = effort.segment || {};
            const row = { i: seg.id || effort.id, n: effort.name || seg.name || "", t: Number(effort.elapsed_time || 0), p: Number(effort.pr_rank || 0), k: Number(effort.kom_rank || 0), c: (seg.city || "").trim(), d: Math.round(seg.distance || 0), g: Math.round(seg.average_grade || 0), e: Math.round((seg.elevation_high || 0) - (seg.elevation_low || 0)), la: Number(seg.start_latlng?.[0] || 0), ln: Number(seg.start_latlng?.[1] || 0) };
            if (seg.id) {
              segmentRows.push({ user_id: user.id, strava_segment_id: seg.id, name: seg.name || effort.name || "Segment", distance: seg.distance || 0, average_grade: seg.average_grade || 0, maximum_grade: seg.maximum_grade || 0, elevation_high: seg.elevation_high, elevation_low: seg.elevation_low, climb_category: seg.climb_category || 0, city: seg.city, state: seg.state, country: seg.country, raw: seg });
              effortRows.push({ user_id: user.id, strava_effort_id: effort.id, strava_activity_id: a.id, strava_segment_id: seg.id, name: effort.name || seg.name, elapsed_time: effort.elapsed_time || 0, moving_time: effort.moving_time || 0, start_date: effort.start_date, start_date_local: effort.start_date_local, average_heartrate: effort.average_heartrate, max_heartrate: effort.max_heartrate, pr_rank: effort.pr_rank, kom_rank: effort.kom_rank, raw: effort });
            }
            return row;
          });
          be = (detail.best_efforts || []).map((b: any) => ({ n: b.name || "", t: Number(b.elapsed_time || 0), p: Number(b.pr_rank || 0) }));
          detailsCheckedAt = new Date().toISOString();
          detailRetryAfter = 0;
        } catch (err) {
          if (err instanceof StravaRateLimitError) throw err;
          detailRetryAfter = Date.now() + 6 * 60 * 60 * 1000;
        }
      }
      const raw = { ...prev, sg, be, details_checked_at: detailsCheckedAt, detail_retry_after: detailRetryAfter || null };
      runs.push({
        id: a.id, date: String(a.start_date_local || a.start_date || "").slice(0, 10),
        km: Math.round(a.distance / 10) / 100, dp: Math.round(a.total_elevation_gain || 0),
        t: Number(a.moving_time || 0), hr: Math.round(a.average_heartrate || 0), sg, be
      });
      activities.push({
        user_id: user.id, strava_activity_id: a.id, name: a.name, sport_type: a.sport_type,
        distance: a.distance, moving_time: a.moving_time, elapsed_time: a.elapsed_time,
        total_elevation_gain: a.total_elevation_gain, start_date: a.start_date,
        summary_polyline: a.map?.summary_polyline || null, raw, updated_at: new Date().toISOString()
      });
    }

    if (activities.length) {
      const { error: upsertErr } = await admin.from("cadenzo_activities").upsert(activities, { onConflict: "user_id,strava_activity_id" });
      if (upsertErr) throw upsertErr;
    }
    if (segmentRows.length) {
      const { error: segErr } = await admin.from("cadenzo_segments").upsert(segmentRows, { onConflict: "user_id,strava_segment_id" });
      if (segErr) throw segErr;
    }
    if (effortRows.length) {
      const { error: effortErr } = await admin.from("cadenzo_segment_efforts").upsert(effortRows, { onConflict: "user_id,strava_effort_id" });
      if (effortErr) throw effortErr;
    }

    // Toujours renvoyer l'historique complet de l'année à l'application.
    // Sinon, lors du rattrapage, seules les activités du dernier lot (souvent novembre)
    // remplacent l'historique local et les trophées semblent disparaître des autres mois.
    const { data: fullHistory, error: fullHistoryErr } = await admin.from("cadenzo_activities")
      .select("strava_activity_id,start_date,distance,total_elevation_gain,moving_time,raw")
      .eq("user_id", user.id).gte("start_date", "2026-01-01T00:00:00Z").order("start_date", { ascending: true });
    if (fullHistoryErr) throw fullHistoryErr;
    const completeRuns = (fullHistory || []).map((a: any) => ({
      id: a.strava_activity_id, date: String(a.start_date || "").slice(0, 10),
      km: Math.round(Number(a.distance || 0) / 10) / 100,
      dp: Math.round(Number(a.total_elevation_gain || 0)),
      t: Number(a.moving_time || 0), hr: Math.round(Number(a.raw?.average_heartrate || 0)),
      sg: Array.isArray(a.raw?.sg) ? a.raw.sg : [], be: Array.isArray(a.raw?.be) ? a.raw.be : []
    }));
    completeRuns.sort((a: any, b: any) => a.date.localeCompare(b.date) || a.km - b.km);
    const completedAt = new Date().toISOString();
    const { error: doneErr } = await admin.from("cadenzo_strava_accounts").update({
      last_sync_at: completedAt, sync_retry_after: null, sync_last_error: null, sync_lock_until: null
    }).eq("user_id", user.id);
    if (doneErr) throw doneErr;
    const cotes = await getClimbSegments(user.id);
    return json({ updated: completedAt, runs: completeRuns, cotes, fetched: activities.length, historyCount: completeRuns.length, detailsProcessed: detailedCount });
  } catch (err) {
    if (err instanceof StravaReauthError) {
      await admin.from("cadenzo_strava_accounts").update({ sync_lock_until: null, sync_last_error: "STRAVA_REAUTH_REQUIRED" }).eq("user_id", user.id);
      return json({ error: err.message, code: "STRAVA_REAUTH_REQUIRED" }, 401);
    }
    if (err instanceof StravaRateLimitError) {
      const retryAt = new Date(Date.now() + err.retryAfterSeconds * 1000).toISOString();
      await admin.from("cadenzo_strava_accounts").update({
        sync_retry_after: retryAt, sync_last_error: "429", sync_lock_until: null
      }).eq("user_id", user.id);
      return json({ error: "Strava limite temporairement les synchronisations.", code: "STRAVA_RATE_LIMIT", retryAfter: err.retryAfterSeconds, retryAt }, 429);
    }
    await admin.from("cadenzo_strava_accounts").update({ sync_lock_until: null }).eq("user_id", user.id);
    throw err;
  }
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || (req.method === "POST" ? "sync" : (url.searchParams.has("code") || url.searchParams.has("error") ? "callback" : "start"));
  try {
    if (action === "health") return json({ status: "ok" }); // aucune information de configuration exposée
    if (action === "start") {
      if (!/^\d+$/.test(STRAVA_CLIENT_ID)) return json({ error: "Service indisponible." }, 503);
      // ménage : les demandes de connexion expirées sont supprimées ; plafond contre le remplissage abusif de la table
      await admin.from("cadenzo_oauth_states").delete().lt("expires_at", new Date().toISOString());
      const { count } = await admin.from("cadenzo_oauth_states").select("state", { count: "exact", head: true });
      if ((count ?? 0) > 300) return json({ error: "Trop de demandes. Réessaie dans quelques minutes." }, 429);
      const state = b64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      const { error } = await admin.from("cadenzo_oauth_states").insert({ state, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() });
      if (error) throw error;
      const q = new URLSearchParams({ client_id: STRAVA_CLIENT_ID, response_type: "code", redirect_uri: REDIRECT_URI, approval_prompt: "auto", scope: "read,activity:read_all,profile:read_all", state });
      return redirect("https://www.strava.com/oauth/authorize?" + q.toString(), COOKIE + "=" + state + "; Max-Age=600; Path=/functions/v1/cadenzo-strava; HttpOnly; Secure; SameSite=Lax");
    }
    if (action === "callback") {
      if (!/^\d+$/.test(STRAVA_CLIENT_ID) || !STRAVA_CLIENT_SECRET || !ENCRYPTION_KEY) return redirect(safeReturn("Service momentanément indisponible."));
      return await callback(req, url);
    }
    if (action === "sync") return await sync(req);
    if (action === "segments") return await findSegments(req);
    return json({ error: "Action inconnue." }, 404);
  } catch (e) {
    console.error("cadenzo-strava:", e instanceof Error ? e.message : "erreur");
    return json({ error: "Erreur serveur. Réessaie dans un instant." }, 500);
  }
});
