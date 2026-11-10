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
                runs.append({"date": a["start_date_local"][:10],
                             "km": round(a["distance"] / 1000, 2),
                             "dp": round(a.get("total_elevation_gain", 0)),
                             "t": int(a.get("moving_time", 0))}
                            | ({"hr": round(a["average_heartrate"])} if a.get("average_heartrate") else {}))
        page += 1
    runs.sort(key=lambda r: (r["date"], r["km"]))
    try:
        old_file = json.load(open("activities.json"))
        prev = old_file["runs"]
        last = datetime.datetime.fromisoformat(old_file.get("updated", ""))
    except Exception:
        prev, last = None, None
    now = datetime.datetime.now(datetime.timezone.utc)
    stale = last is None or (now - last).days >= KEEPALIVE_DAYS
    if not runs and prev:  # réponse vide inattendue : on garde les sorties déjà publiées
        print("::warning::Strava n'a renvoyé aucune sortie, activities.json n'est pas modifié.")
        return
    # on n'écrit (et ne commit) que s'il y a du nouveau, ou une fois par mois pour garder la synchro active
    if prev != runs or stale:
        json.dump({"updated": now.isoformat(timespec="seconds"),
                   "runs": runs}, open("activities.json", "w"), ensure_ascii=False, indent=1)
        print(len(runs), "sorties écrites dans activities.json")
    else:
        print("Aucun changement")


if __name__ == "__main__":
    {"sync": sync, "setup": setup}[sys.argv[1]]()
