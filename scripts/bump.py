#!/usr/bin/env python3
"""Incrémente la version à partir du maximum trouvé pour éviter toute régression."""
import re
from pathlib import Path

app = Path("app.js")
sources = [app, Path("index.html"), Path("sw.js"), Path("auth.js")]
texts = {p: p.read_text(encoding="utf-8") for p in sources}
versions = []
for p, content in texts.items():
    if p == app:
        m = re.search(r"var APPV=(\d+);", content)
        if m:
            versions.append(int(m.group(1)))
    versions += [int(v) for v in re.findall(r"\?v=(\d+)", content)]
    versions += [int(v) for v in re.findall(r"thp40-v(\d+)", content)]
n = max(versions, default=0) + 1

for p in (Path("index.html"), Path("sw.js"), Path("auth.js")):
    content = texts[p]
    content = re.sub(r"\?v=\d+", f"?v={n}", content)
    content = re.sub(r"thp40-v\d+", f"thp40-v{n}", content)
    p.write_text(content, encoding="utf-8")

content = texts[app]
content, count = re.subn(r"var APPV=\d+;", f"var APPV={n};", content, count=1)
if count != 1:
    raise SystemExit("APPV introuvable ou ambigu dans app.js")
app.write_text(content, encoding="utf-8")
print(f"Version synchronisée : v{n}")
