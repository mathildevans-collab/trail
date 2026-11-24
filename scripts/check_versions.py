#!/usr/bin/env python3
"""Vérifie qu'un seul numéro de version est utilisé partout (voir bump.py)."""
import re, sys
v = re.search(r"var APPV=(\d+);", open("app.js").read()).group(1)
bad = []
for f in ("index.html", "sw.js", "auth.js"):
    s = open(f).read()
    for x in re.findall(r"\?v=(\d+)", s) + re.findall(r"thp40-v(\d+)", s):
        if x != v: bad.append((f, x))
if bad:
    print("Versions incohérentes (APPV=%s) : %s" % (v, bad)); sys.exit(1)
print("OK v" + v)
