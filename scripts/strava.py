#!/usr/bin/env python3
"""Lit les sorties de course Strava et écrit activities.json (mode sync),
ou échange le code d'autorisation contre un jeton (mode setup).
Aucun secret n'est écrit dans le dépôt : tout passe par les Secrets GitHub."""
import re
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
                print("::error::Strava refuse le jeton (" + str(e.code) + ") : " + body + ". Relance l'Action « Strava setup » avec un nouveau code (voir le README).")
            else:
                print("::error::Strava a répondu " + str(e.code) + " : " + body)
            raise
        except (urllib.error.URLError, TimeoutError):
            if i + 1 < tries:
                time.sleep(20 * (i + 1)); continue
            raise


MAX_DETAILS = 40  # appels « détail » par lecture : Strava limite à 100 requêtes / 15 min, le reste suit à la lecture suivante


def geo(seg):
    """Forme du segment (longueur, pente, dénivelé, départ) : sert à proposer les côtes."""
    try:
        la, ln = seg["start_latlng"]
        return {"d": round(seg["distance"]), "g": round(seg.get("average_grade") or 0, 1),
                "e": round((seg.get("elevation_high") or 0) - (seg.get("elevation_low") or 0)), "la": round(la, 4), "ln": round(ln, 4)}
    except Exception:
        return {}


def details(run_id, access):
    """Segments parcourus et meilleurs temps d'une sortie, réduits au minimum utile aux trophées."""
    d = get(API + "/api/v3/activities/" + str(run_id) + "?include_all_efforts=true", access)
    sg = []
    for e in d.get("segment_efforts") or []:
        seg = e.get("segment") or {}
        sg.append({"i": seg.get("id") or e.get("id"), "n": e.get("name") or seg.get("name") or "",
                   "t": int(e.get("elapsed_time") or 0), "p": int(e.get("pr_rank") or 0),
                   "k": int(e.get("kom_rank") or 0), "c": (seg.get("city") or "").strip()}
                  | geo(seg))
    be = [{"n": b.get("name") or "", "t": int(b.get("elapsed_time") or 0), "p": int(b.get("pr_rank") or 0)}
          for b in d.get("best_efforts") or []]
    return sg, be


COTE_MAX_M = 800      # côtes d'au plus 800 m de montée
COTE_REFRESH_J = 30   # une zone est relue au plus une fois par mois


def load_lieux():
    try:
        cfg = json.load(open("lieux.json"))
    except Exception:
        return {"canal": "", "lieux": []}
    if isinstance(cfg, list):
        cfg = {"canal": "", "lieux": cfg}
    return cfg


def lieux_demandes(cfg):
    """Villes demandées depuis l'appli : elle les publie sur un canal ntfy, lu ici (6 lieux au plus)."""
    if not cfg.get("canal"):
        return False
    try:
        raw = urllib.request.urlopen("https://ntfy.sh/" + cfg["canal"] + "/json?poll=1&since=72h", timeout=15).read().decode()
    except Exception as e:
        print("::warning::Demandes de lieu non lues : " + str(e)[:80])
        return False
    changed = False
    for line in raw.splitlines():
        try:
            m = json.loads(json.loads(line).get("message", ""))
            lid, nom = str(m["id"]), str(m["nom"]).strip()[:30]
            lat, lng = float(m["lat"]), float(m["lng"])
            if not re.fullmatch(r"[a-z0-9-]{1,30}", lid) or not nom or not (-90 <= lat <= 90 and -180 <= lng <= 180):
                continue
        except Exception:
            continue
        if len(cfg["lieux"]) < 6 and all(l["id"] != lid for l in cfg["lieux"]):
            cfg["lieux"].append({"id": lid, "nom": nom, "lat": round(lat, 5), "lng": round(lng, 5), "r": 5})
            changed = True
    if changed:
        json.dump(cfg, open("lieux.json", "w"), ensure_ascii=False, indent=1)
    return changed


def explore(lieu, access):
    """Segments autour d'un lieu, même jamais courus : grille 3 x 3 (Strava ne rend que 10 segments par zone). Demande l'autorisation « read »."""
    import math
    dlat = lieu["r"] / 111.0
    dlng = lieu["r"] / (111.0 * math.cos(math.radians(lieu["lat"])))
    out, vus = {}, set()
    for i in range(3):
        for j in range(3):
            sw = (lieu["lat"] - dlat + i * 2 * dlat / 3, lieu["lng"] - dlng + j * 2 * dlng / 3)
            ne = (sw[0] + 2 * dlat / 3, sw[1] + 2 * dlng / 3)
            q = urllib.parse.urlencode({"bounds": "%.5f,%.5f,%.5f,%.5f" % (sw + ne), "activity_type": "running"})
            for s in get(API + "/api/v3/segments/explore?" + q, access).get("segments", []):
                vus.add(s["id"])
                d, g, e = s.get("distance", 0), s.get("avg_grade", 0), s.get("elev_difference", 0)
                if 100 <= d <= COTE_MAX_M and g >= 4 and e >= 8 and s.get("start_latlng"):
                    out[s["id"]] = {"i": s["id"], "n": s.get("name", ""), "d": round(d), "g": round(g, 1), "e": round(e),
                                    "v": "", "la": round(s["start_latlng"][0], 4), "ln": round(s["start_latlng"][1], 4), "s": "e"}
    print("Côtes " + lieu["nom"] + " : " + str(len(vus)) + " segments trouvés, " + str(len(out)) + " gardés")
    return list(out.values())


def cotes_for(runs, prev, access, now):
    """Côtes proposées : recherche Strava autour de chaque lieu (jamais courues comprises) + segments déjà courus."""
    import math
    cfg = load_lieux()
    lieux_demandes(cfg)
    segs = {}
    for r in runs:
        for e in r.get("sg") or []:
            if "d" in e and e["i"] not in segs:
                segs[e["i"]] = e
    res = {}
    for l in cfg["lieux"]:
        old = (prev or {}).get(l["id"]) or {}
        ex = old.get("ex")           # résultats de la recherche, gardés 30 jours
        t_ex = old.get("t_ex", "")
        t_fail = old.get("t_fail", "")
        age = lambda t: (now - datetime.datetime.fromisoformat(t)).total_seconds() / 3600 if t else 1e9
        if (ex is None or age(t_ex) > COTE_REFRESH_J * 24) and age(t_fail) > 12:
            try:
                ex, t_ex, t_fail = explore(l, access), now.isoformat(timespec="seconds"), ""
            except Exception as e:
                print("::warning::Recherche de côtes refusée (" + str(e)[:60] + ") : autorisation « read » à ajouter, voir README")
                t_fail = now.isoformat(timespec="seconds")
        items = {c["i"]: dict(c) for c in (ex or [])}
        for e in segs.values():
            if 100 <= e["d"] <= COTE_MAX_M and e["g"] >= 4 and e["e"] >= 8 and e["i"] not in items:
                items[e["i"]] = {"i": e["i"], "n": e["n"], "d": e["d"], "g": e["g"], "e": e["e"], "v": e.get("c", ""), "la": e["la"], "ln": e["ln"], "s": "h"}
        out = []
        for c in items.values():
            km = math.hypot((c["la"] - l["lat"]) * 111.0, (c["ln"] - l["lng"]) * 111.0 * math.cos(math.radians(l["lat"])))
            if km <= l["r"] * 1.15:
                c["k"] = round(km, 1)
                out.append(c)
        res[l["id"]] = {"nom": l["nom"], "lat": l["lat"], "lng": l["lng"], "items": sorted(out, key=lambda c: -c["e"])[:30]}
        if ex is not None:
            res[l["id"]]["ex"], res[l["id"]]["t_ex"] = ex, t_ex
        if t_fail:
            res[l["id"]]["t_fail"] = t_fail
    return res


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
        prev_cotes = old_file.get("cotes") or {}
        last = datetime.datetime.fromisoformat(old_file.get("updated", ""))
    except Exception:
        prev, last, prev_cotes = None, None, {}
    # segments et records : repris du fichier précédent, lus chez Strava seulement pour les sorties nouvelles
    known = {p["id"]: p for p in (prev or []) if p.get("id") and "sg" in p and all("d" in e for e in p["sg"])}
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
    now = datetime.datetime.now(datetime.timezone.utc)
    cotes = cotes_for(runs, prev_cotes, access, now)
    stale = last is None or (now - last).days >= KEEPALIVE_DAYS
    if not runs and prev:  # réponse vide inattendue : on garde les sorties déjà publiées
        print("::warning::Strava n'a renvoyé aucune sortie, activities.json n'est pas modifié.")
        return
    # on n'écrit (et ne commit) que s'il y a du nouveau, ou une fois par mois pour garder la synchro active
    if prev != runs or cotes != prev_cotes or stale:
        json.dump({"updated": now.isoformat(timespec="seconds"),
                   "runs": runs, "cotes": cotes}, open("activities.json", "w"), ensure_ascii=False, indent=1)
        print(len(runs), "sorties écrites dans activities.json")
    else:
        print("Aucun changement")


if __name__ == "__main__":
    {"sync": sync, "setup": setup}[sys.argv[1]]()
