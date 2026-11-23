#!/usr/bin/env python3
"""Nouvelle version : python3 scripts/bump.py
Un seul numéro partout : ?v=N dans index.html, sw.js et auth.js, nom du cache, APPV dans app.js."""
import re
v = int(re.search(r"var APPV=(\d+);", open("app.js").read()).group(1))
n = v + 1
for f in ("index.html", "sw.js", "auth.js"):
    s = open(f).read()
    s = re.sub(r"\?v=\d+", "?v=%d" % n, s)
    s = re.sub(r"thp40-v\d+", "thp40-v%d" % n, s)
    open(f, "w").write(s)
s = open("app.js").read()
open("app.js", "w").write(re.sub(r"var APPV=\d+;", "var APPV=%d;" % n, s))
print("v%d -> v%d" % (v, n))
