#!/usr/bin/env python3
"""Détecte les secrets écrits en dur sans signaler les noms de variables documentés."""
from pathlib import Path
import re
import sys

ROOT = Path(".")
EXTENSIONS = {".js", ".html", ".ts", ".json", ".py", ".sql", ".toml", ".yml", ".yaml"}
SKIP_DIRS = {".git", ".github"}  # Les workflows sont relus séparément et ne contiennent que des références de variables.
PATTERNS = [
    re.compile(r"(?i)\bsk_live_[A-Za-z0-9]{16,}"),
    re.compile(r"(?i)\b(?:STRAVA_CLIENT_SECRET|SUPABASE_SERVICE_ROLE_KEY|service_role_key)\s*[:=]\s*['\"][^'\"\s]{12,}['\"]"),
    re.compile(r"(?i)\bclient_secret\s*[:=]\s*['\"][A-Za-z0-9_./+=-]{20,}['\"]"),
    re.compile(r"\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b"),
]
issues = []
for path in ROOT.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
        continue
    if any(part in SKIP_DIRS for part in path.parts):
        continue
    if path.name in {"supabase.min.js"}:
        continue
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except (UnicodeDecodeError, OSError):
        continue
    for number, line in enumerate(lines, 1):
        for pattern in PATTERNS:
            if pattern.search(line):
                issues.append(f"{path}:{number}: valeur pouvant être un secret")
                break

if issues:
    print("\n".join(issues))
    print("Échec : retirer les secrets du dépôt et les stocker dans le gestionnaire de secrets.")
    sys.exit(1)
print("Aucun secret manifeste détecté.")
