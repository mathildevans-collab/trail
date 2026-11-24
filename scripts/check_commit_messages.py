#!/usr/bin/env python3
"""Refuse les titres de commits vagues et impose une action claire."""
import os
import re
import subprocess
import sys

# Un titre doit commencer par une action compréhensible, pas par un préfixe technique.
ACTION = re.compile(
    r"^(Ajoute|Améliore|Automatise|Bloque|Centralise|Charge|Clarifie|"
    r"Conserve|Préserve|Corrige|Décrit|Détecte|Documente|Déplace|Évite|"
    r"Explique|Affiche|Gère|Limite|Masque|Met à jour|Nettoie|"
    r"Permet|Protège|Répare|Remplace|Renomme|Réorganise|Rétablit|"
    r"Rend|Sécurise|Simplifie|Supprime|Trie|Vérifie|"
    r"Empêche|Prépare|Réduit|Ajoute|Retire|Autorise|Fixer|Branche|Renforce|Applique|Couvre|"
    r"Add|Improve|Automate|Block|Centralize|Load|Clarify|Keep|Correct|"
    r"Describe|Detect|Document|Move|Avoid|Explain|Show|Manage|Limit|"
    r"Hide|Update|Clean|Allow|Protect|Repair|Replace|Rename|Refactor|"
    r"Restore|Make|Secure|Simplify|Remove|Sort|Verify|Prevent|Prepare|"
    r"Reduce|Integrate|Use|Isolate|Precache)\b",
    re.IGNORECASE,
)
VAGUE = {
    "update", "updated", "fix", "fix bug", "bug fix", "correction",
    "modification", "modifications", "changes", "update files",
    "mise a jour", "mise à jour", "divers", "test", "tests",
    "amélioration", "améliorations", "mise à jour du code",
    "modification du code", "correction de bugs",
}


def est_un_titre_clair(message):
    titre = message.strip()
    normalise = titre.lower().rstrip(".!")
    if len(titre) < 22 or len(titre) > 90 or normalise in VAGUE:
        return False
    if not ACTION.match(titre):
        return False
    # Refuse les titres qui annoncent seulement une action sans préciser l'objet.
    reste = ACTION.sub("", titre, count=1).strip(" :—-")
    return len(reste.split()) >= 2


def main():
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
        return 2

    invalides = [message for message in messages if not est_un_titre_clair(message)]
    if invalides:
        print("Ces titres doivent commencer par une action claire et préciser leur objet :")
        for titre in invalides:
            print(f"  - {titre}")
        print("\nExemples attendus (français ou anglais) :")
        print("  Corrige la recherche des segments proches")
        print("  Explique le chargement des séances dans le planning")
        print("  Évite de perdre la session après une mise en veille")
        return 1

    print(f"{len(messages)} titre(s) de commit vérifié(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
