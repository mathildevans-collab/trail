#!/usr/bin/env python3
"""Lit les sorties de course Strava et écrit activities.json (mode sync),
ou échange le code d'autorisation contre un jeton (mode setup).
Aucun secret n'est écrit dans le dépôt : tout passe par les Secrets GitHub."""
import json, os, sys, time, datetime, urllib.parse, urllib.request

API = "https://www.strava.com"
START = int(datetime.datetime(2026, 9, 28, tzinfo=datetime.timezone.utc).timestamp())


def post(url, data):
    req = urllib.request.Request(url, data=urllib.parse.urlencode(data).encode(), method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def get(url, token):
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + token})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


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
                             "t": int(a.get("moving_time", 0))})
        page += 1
    runs.sort(key=lambda r: (r["date"], r["km"]))
    try:
        prev = json.load(open("activities.json"))["runs"]
    except Exception:
        prev = None
    if prev != runs:  # on n'écrit (et ne commit) que s'il y a du nouveau
        json.dump({"updated": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
                   "runs": runs}, open("activities.json", "w"), ensure_ascii=False, indent=1)
        print(len(runs), "sorties écrites dans activities.json")
    else:
        print("Aucun changement")


if __name__ == "__main__":
    {"sync": sync, "setup": setup}[sys.argv[1]]()
