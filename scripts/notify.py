#!/usr/bin/env python3
"""Compare activities.json (fichier qui vient d'être lu) avec la version déjà publiée
et écrit dans le fichier donné en argument le texte de la notification s'il y a une nouvelle sortie.
Rien n'est écrit s'il n'y a rien de nouveau."""
import datetime, json, subprocess, sys

out = sys.argv[1]
try:
    new = json.load(open("activities.json")).get("runs", [])
    try:
        old = json.loads(subprocess.check_output(["git", "show", "HEAD:activities.json"], stderr=subprocess.DEVNULL)).get("runs", [])
    except Exception:
        old = []
except Exception:
    sys.exit(0)

def key(r):
    return (r["date"], round(float(r["km"]), 1))

seen = {key(r) for r in old}
limit = (datetime.date.today() - datetime.timedelta(days=3)).isoformat()   # pas de rafale pour l'ancien historique
fresh = [r for r in new if key(r) not in seen and r["date"] >= limit]
if not seen or not fresh:   # première lecture : on ne notifie pas tout l'historique
    sys.exit(0)

def fmt(r):
    t = int(r.get("t", 0)); h, m = divmod(t // 60, 60)
    s = ("%.1f km" % r["km"]).replace(".", ",")
    if r.get("dp"):
        s += " · +%d m" % round(r["dp"])
    if t:
        s += " · %d h %02d" % (h, m) if h else " · %d min" % m
    return s

lines = [fmt(r) for r in fresh]
msg = ("Séance synchronisée : " + lines[0]) if len(lines) == 1 else "Séances synchronisées :\n" + "\n".join(lines)
open(out, "w", encoding="utf-8").write(msg + "\nLe bilan du coach est prêt.")
