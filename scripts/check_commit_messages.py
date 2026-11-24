#!/usr/bin/env python3
"""Vérifie que les titres des commits expliquent clairement le changement."""
import os
import re
import subprocess
import sys

# Les anciens titres préfixés restent acceptés pendant la transition.
CONVENTIONAL = re.compile(
    r"^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)"
    r"(\([a-z0-9][a-z0-9._/-]*\))?!?: .{8,}$"
)
VAGUE = {
    "update", "updated", "fix", "fix bug", "bug fix", "correction",
    "modification", "modifications", "changes", "update files",
    "mise a jour", "mise à jour", "divers", "test", "tests",
}

base = os.environ.get("BASE_SHA", "")
head = os.environ.get("HEAD_SHA", "HEAD")
if not base:
    base = f"{head}~1"

try:
    messages = subprocess.check_output(
        ["git", "log", "--format=%s", f"{base}..{head}"],
        text=True,
        stderr=subprocess.STDOUT,
    ).splitlines()
except subprocess.CalledProcessError as exc:
    print("Impossible de lire les titres des commits :")
    print(exc.output)
    sys.exit(2)

invalid = []
for message in messages:
    title = message.strip()
    normalized = title.lower().rstrip(".!")
    if len(title) > 100 or len(title) < 16 or normalized in VAGUE:
        invalid.append(message)
    elif not CONVENTIONAL.match(title) and not re.search(r"[a-zà-ÿ]{3,}", title, re.I):
        invalid.append(message)

if invalid:
    print("Ces titres ne disent pas assez clairement ce qui a changé :")
    for title in invalid:
        print(f"  - {title}")
    print("\nÉcris un titre court et concret, par exemple :")
    print("  Corrige la recherche des segments proches")
    print("  Explique le chargement des séances dans le planning")
    print("Évite les titres vagues comme « update » ou « correction ».")
    sys.exit(1)

print(f"{len(messages)} titre(s) de commit vérifié(s).")
