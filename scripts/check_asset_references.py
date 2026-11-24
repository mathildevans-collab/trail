#!/usr/bin/env python3
"""Vérifie les fichiers réellement chargés par la PWA et son mode hors ligne."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import sys
from urllib.parse import urlsplit

ROOT = Path(".").resolve()
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
        target.relative_to(ROOT)
    except ValueError:
        errors.append(f"{origin} : chemin hors du dépôt ({reference})")
        return
    if not target.is_file():
        errors.append(f"{origin} : fichier introuvable ({reference})")
    checked.add(path)

class ResourceParser(HTMLParser):
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        for attribute in ("src", "href"):
            if values.get(attribute):
                check(values[attribute], f"index.html, balise {tag}")

html_path = ROOT / "index.html"
manifest_path = ROOT / "manifest.webmanifest"
worker_path = ROOT / "sw.js"

for required in (html_path, manifest_path, worker_path):
    if not required.is_file():
        errors.append(f"Fichier obligatoire manquant : {required.name}")

if html_path.is_file():
    ResourceParser().feed(html_path.read_text(encoding="utf-8"))

if manifest_path.is_file():
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for icon in manifest.get("icons", []):
        check(icon.get("src"), "manifest.webmanifest, icône")

if worker_path.is_file():
    worker = worker_path.read_text(encoding="utf-8")
    match = re.search(r"const\s+SHELL\s*=\s*\[(.*?)\];", worker, re.S)
    if not match:
        errors.append("sw.js : impossible de lire la liste des fichiers conservés hors ligne")
    else:
        shell_entries = re.findall(r"['\"]([^'\"]+)['\"]", match.group(1))
        for entry in shell_entries:
            check(entry, "sw.js, cache hors ligne")

if errors:
    print("\n".join(errors))
    print(f"\nContrôle échoué : {len(errors)} problème(s) à corriger.")
    sys.exit(1)

print(f"Tout est bon : {len(checked)} fichier(s) local(aux) référencé(s) existent.")
