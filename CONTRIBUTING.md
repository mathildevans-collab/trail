# Contribuer à Cadenzo

## Avant de modifier le projet

- Une branche par sujet : `amelioration/...`, `correction/...`, `documentation/...`.
- Un changement doit rester limité et facile à relire.
- Vérifier les fichiers qui chargent ou référencent le code modifié.
- Ne jamais ajouter de jeton, mot de passe, clé privée ou donnée personnelle.

## Titres des commits : du français simple et concret

Le titre doit permettre de comprendre le changement sans ouvrir le code.

Exemples attendus :

- `Corrige la recherche des segments proches`
- `Affiche les records dans l'ordre du meilleur temps`
- `Explique la configuration de Strava dans le guide`
- `Évite de perdre la session après une mise en veille`

Évite les titres vagues ou artificiels : `update`, `fix bug`, `modifications diverses`, `améliorations`, `mise à jour du code`.

Les anciens titres préfixés (`fix(...):`, `feat(...):`) restent acceptés pendant la transition, mais les nouveaux commits doivent privilégier une phrase naturelle en français.

## Vérifications avant d'ouvrir une Pull Request

Pour une modification frontend :

```bash
python3 scripts/bump.py
python3 scripts/check_versions.py
python3 scripts/check_asset_references.py
for file in *.js; do node --check "$file" || exit 1; done
python3 -m compileall -q scripts
```

Relire ensuite le diff et vérifier que les tests annoncés ont réellement été exécutés.

## Pull Requests

La description doit répondre simplement à ces questions :

1. Quel problème est corrigé ?
2. Qu'est-ce qui change concrètement ?
3. Quels fichiers importants ont été modifiés ?
4. Quels contrôles ont été exécutés ?
5. Quel risque reste à surveiller ?

Une Pull Request ne doit être fusionnée que lorsque tous les contrôles obligatoires sont verts.
