#!/usr/bin/env python3
"""Lit les sorties de course Strava et écrit activities.json (mode sync),
ou échange le code d'autorisation contre un jeton (mode setup).
Aucun secret n'est écrit dans le dépôt : tout passe par les Secrets GitHub."""
import json, os, sys, time, datetime, urllib.error, urllib.parse, urllib.request

API = "https://www.strava.com"
START = int(datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc).timestamp())


KEEPALIVE_DAYS = 30  # GitHub coupe les tâches planifiées d'un dépôt sans commit depuis 60 jours


def call(req, tries=4):
    """Requête avec nouvel essai si Strava est lent, saturé (429) ou en panne (5xx)."""
    for i in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")[:300]
            if e.code in (429, 500, 502, 503, 504) and i + 1 < tries:
                time.sleep(20 * (i + 1)); continue
            if e.code in (400, 401) and "oauth/token" in req.full_url:
                print("::error::Strava refuse le jeton (" + str(e.code) + "). Relance l'Action « Strava setup » avec un nouveau code (voir le README).")
            else:
                print("::error::Strava a répondu " + str(e.code) + " : " + body)
            raise
        except (urllib.error.URLError, TimeoutError):
            if i + 1 < tries:
                time.sleep(20 * (i + 1)); continue
            raise


MAX_DETAILS = 40  # appels « détail » par lecture : Strava limite à 100 requêtes / 15 min, le reste suit à la lecture suivante


def details(run_id, access):
    """Segments parcourus et meilleurs temps d'une sortie, réduits au minimum utile aux trophées."""
    d = get(API + "/api/v3/activities/" + str(run_id) + "?include_all_efforts=true", access)
    sg = []
    for e in d.get("segment_efforts") or []:
        seg = e.get("segment") or {}
        sg.append({"i": seg.get("id") or e.get("id"), "n": e.get("name") or seg.get("name") or "",
                   "t": int(e.get("elapsed_time") or 0), "p": int(e.get("pr_rank") or 0),
                   "k": int(e.get("kom_rank") or 0), "c": (seg.get("city") or "").strip()})
    be = [{"n": b.get("name") or "", "t": int(b.get("elapsed_time") or 0), "p": int(b.get("pr_rank") or 0)}
          for b in d.get("best_efforts") or []]
    return sg, be


MAX_SEGS = 40  # tracés de segments lus par lecture (limite Strava : 100 requêtes / 15 min)


def wanted_segments(runs):
    """Segments utiles à la carte : ceux qui ont une médaille, puis les plus fréquentés."""
    medal, freq = {}, {}
    for r in runs:
        for e in r.get("sg") or []:
            freq[e["i"]] = freq.get(e["i"], 0) + 1
            if 0 < e.get("p", 0) <= 3:
                medal[e["i"]] = 1
    ids = [i for i in freq if i in medal or freq[i] >= 4]
    return sorted(ids, key=lambda i: (i not in medal, -freq[i]))


def segment_lines(runs, prev_segs, access):
    out = dict(prev_segs or {})
    left = MAX_SEGS
    for i in wanted_segments(runs):
        if str(i) in out or left <= 0:
            continue
        left -= 1
        try:
            d = get(API + "/api/v3/segments/" + str(i), access)
            out[str(i)] = ((d.get("map") or {}).get("polyline") or "")
        except Exception as e:
            print("::warning::Tracé du segment " + str(i) + " non lu : " + str(e)[:80])
    return out


def post(url, data):
    return call(urllib.request.Request(url, data=urllib.parse.urlencode(data).encode(), method="POST"))


def get(url, token):
    return call(urllib.request.Request(url, headers={"Authorization": "Bearer " + token}))


def save_new_refresh(token):
    # le jeton est masqué dans les journaux, puis écrit hors du dépôt
    print("::add-mask::" + token)
    with open(os.environ["RT_OUT"], "w") as f:
        f.write(token)


def setup():
    tok = post(API + "/oauth/token", {
        "client_id": os.environ["STRAVA_CLIENT_ID"],
        "client_secret": os.environ["STRAVA_CLIENT_SECRET"],
        "code": os.environ["STRAVA_CODE"].strip(),
        "grant_type": "authorization_code"})
    save_new_refresh(tok["refresh_token"])
    print("Autorisation Strava acceptée pour :", tok.get("athlete", {}).get("firstname", "?"))


def sync():
    old = os.environ["STRAVA_REFRESH_TOKEN"]
    tok = post(API + "/oauth/token", {
        "client_id": os.environ["STRAVA_CLIENT_ID"],
        "client_secret": os.environ["STRAVA_CLIENT_SECRET"],
        "grant_type": "refresh_token", "refresh_token": old})
    access = tok["access_token"]
    if tok.get("refresh_token") and tok["refresh_token"] != old:
        save_new_refresh(tok["refresh_token"])
    runs, page = [], 1
    while page <= 10:
        q = urllib.parse.urlencode({"after": START, "per_page": 100, "page": page})
        acts = get(API + "/api/v3/athlete/activities?" + q, access)
        if not acts:
            break
        for a in acts:
            if a.get("sport_type") in ("Run", "TrailRun") and a.get("distance", 0) > 0:
                runs.append({"id": a["id"], "date": a["start_date_local"][:10],
                             "km": round(a["distance"] / 1000, 2),
                             "dp": round(a.get("total_elevation_gain", 0)),
                             "t": int(a.get("moving_time", 0))}
                            | ({"hr": round(a["average_heartrate"])} if a.get("average_heartrate") else {}))
        page += 1
    runs.sort(key=lambda r: (r["date"], r["km"]))
    try:
        old_file = json.load(open("activities.json"))
        prev = old_file["runs"]
        prev_segs = old_file.get("segs") or {}
        last = datetime.datetime.fromisoformat(old_file.get("updated", ""))
    except Exception:
        prev, last, prev_segs = None, None, {}
    # segments et records : repris du fichier précédent, lus chez Strava seulement pour les sorties nouvelles
    known = {p["id"]: p for p in (prev or []) if p.get("id") and "sg" in p}
    left = MAX_DETAILS
    for r in sorted(runs, key=lambda r: r["date"], reverse=True):
        if r["id"] in known:
            r["sg"], r["be"] = known[r["id"]]["sg"], known[r["id"]].get("be", [])
        elif left > 0:
            left -= 1
            try:
                r["sg"], r["be"] = details(r["id"], access)
            except Exception as e:  # un détail raté ne doit jamais bloquer la lecture des sorties
                print("::warning::Détail de la sortie " + str(r["id"]) + " non lu : " + str(e)[:80])
    segs = segment_lines(runs, prev_segs, access)
    now = datetime.datetime.now(datetime.timezone.utc)
    stale = last is None or (now - last).days >= KEEPALIVE_DAYS
    if not runs and prev:  # réponse vide inattendue : on garde les sorties déjà publiées
        print("::warning::Strava n'a renvoyé aucune sortie, activities.json n'est pas modifié.")
        return
    # on n'écrit (et ne commit) que s'il y a du nouveau, ou une fois par mois pour garder la synchro active
    if prev != runs or segs != prev_segs or stale:
        json.dump({"updated": now.isoformat(timespec="seconds"),
                   "runs": runs, "segs": segs}, open("activities.json", "w"), ensure_ascii=False, indent=1)
        print(len(runs), "sorties écrites dans activities.json")
    else:
        print("Aucun changement")


if __name__ == "__main__":
    {"sync": sync, "setup": setup}[sys.argv[1]]()
