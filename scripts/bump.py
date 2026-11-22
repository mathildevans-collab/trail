#!/usr/bin/env python3
"""Nouvelle version : python3 scripts/bump.py  (incrémente partout : index.html, sw.js, APPV dans app.js)."""
import re
v = int(re.search(r"thp40-v(\d+)", open("sw.js").read()).group(1))
n = v + 1
for f, pats in (("index.html", [(r"\?v=%d" % v, "?v=%d" % n)]), ("sw.js", [(r"thp40-v%d" % v, "thp40-v%d" % n), (r"\?v=%d" % v, "?v=%d" % n)]),
                ("app.js", [(r"var APPV=%d;" % v, "var APPV=%d;" % n)])):
    s = open(f).read()
    for a, b in pats:
        s = re.sub(a, b, s)
    open(f, "w").write(s)
print("v%d → v%d" % (v, n))
