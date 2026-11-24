#!/usr/bin/env python3
"""Vérifie le format Conventional Commits des commits d'une Pull Request."""
import os
import re
import subprocess
import sys

PATTERN = re.compile(
    r"^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)"
    r"(\([a-z0-9][a-z0-9._/-]*\))?!?: .{8,}$"
)

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
    print("Impossible de lire les commits à vérifier :")
    print(exc.output)
    sys.exit(2)

if not messages:
    print("Aucun nouveau commit à vérifier.")
    sys.exit(0)

invalid = [message for message in messages if not PATTERN.match(message)]
for message in invalid:
    print(f"Message non conforme : {message}")

if invalid:
    print("\nFormat attendu : type(portee): description claire (8 caractères minimum).")
    sys.exit(1)

print(f"{len(messages)} message(s) de commit conforme(s).")
