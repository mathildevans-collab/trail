# Contribuer à Cadenzo

## Avant de modifier le projet

- Créer une branche par sujet : `correction/...`, `amelioration/...`, `documentation/...` ou `securite/...`.
- Garder chaque changement limité et facile à relire.
- Vérifier les fichiers qui chargent ou référencent le code modifié.
- Ne jamais ajouter de jeton, mot de passe, clé privée ou donnée personnelle.

## Écrire des titres compréhensibles

Le titre d'un commit doit dire précisément ce qui a changé. Écris une phrase courte en français, avec un verbe d'action.

Exemples :

- `Corrige la recherche des segments proches`
- `Affiche les records du meilleur au moins bon`
- `Explique la connexion Strava dans le guide`
- `Évite de perdre la session après une mise en veille`

N'utilise pas de titre vague : `update`, `fix bug`, `modifications diverses`, `améliorations` ou `mise à jour du code`.

Les anciens titres au format `fix(...): ...` ou `feat(...): ...` restent acceptés pendant la transition. Pour les nouveaux changements, privilégie une phrase naturelle en français.

## Vérifications avant d'ouvrir une Pull Request

Pour une modification frontend :

```bash
python3 scripts/bump.py
python3 scripts/check_versions.py
python3 scripts/check_asset_references.py
for file in *.js; do node --check "$file" || exit 1; done
python3 -m compileall -q scripts
```

Relire le diff et ne déclarer que les tests réellement exécutés.

## Décrire une Pull Request

La description doit expliquer simplement :

1. Quel problème est corrigé ?
2. Qu'est-ce qui change concrètement ?
3. Quels fichiers importants ont été modifiés ?
4. Quels contrôles ont été exécutés ?
5. Quel risque reste à surveiller ?

Ne jamais fusionner une Pull Request tant qu'un contrôle obligatoire est en échec.
