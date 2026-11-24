#!/usr/bin/env python3
"""Vérifie que les ressources locales déclarées par la PWA existent."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import sys
from urllib.parse import urlsplit

ROOT = Path(".")
errors = []
checked = set()

def local_path(reference):
    if not reference or reference.startswith(("#", "data:", "blob:")):
        return None
    parsed = urlsplit(reference)
    if parsed.scheme or parsed.netloc:
        return None
    path = parsed.path
    if not path or path.startswith("/"):
        return None
    return path

def check(reference, origin):
    path = local_path(reference)
    if path is None:
        return
    target = (ROOT / path).resolve()
    try:
        target.relative_to(ROOT.resolve())
    except ValueError:
        errors.append(f"{origin}: chemin sortant du dépôt : {reference}")
        return
    if not target.is_file():
        errors.append(f"{origin}: fichier introuvable : {reference}")
    checked.add(path)

class ResourceParser(HTMLParser):
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        for attribute in ("src", "href"):
            if values.get(attribute):
                check(values[attribute], f"index.html ({tag}.{attribute})")

html = (ROOT / "index.html").read_text(encoding="utf-8")
ResourceParser().feed(html)

manifest_path = ROOT / "manifest.webmanifest"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
for icon in manifest.get("icons", []):
    check(icon.get("src"), "manifest.webmanifest (icône)")

service_worker = (ROOT / "sw.js").read_text(encoding="utf-8")
match = re.search(r"const\\s+SHELL\\s*=\\s*\\[(.*?)\\];", service_worker, re.S)
if not match:
    errors.append("sw.js : liste des ressources hors ligne SHELL introuvable")
else:
    shell_entries = re.findall(r"['\"]([^'\"]+)['\"]", match.group(1))
    for entry in shell_entries:
        check(entry, "sw.js (cache hors ligne)")

if errors:
    print("\\n".join(errors))
    print(f"\\nÉchec : {len(errors)} ressource(s) manquante(s) ou invalide(s).")
    sys.exit(1)

print(f"{len(checked)} ressource(s) locale(s) vérifiée(s) : HTML, icônes et cache hors ligne.")
