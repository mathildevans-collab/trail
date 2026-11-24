# Contribuer à Cadenzo

## Règles avant chaque commit

- Un sujet fonctionnel par branche.
- Aucun secret ni donnée personnelle dans le dépôt.
- Vérifier les fichiers impactés et leurs références.
- Pour une modification frontend : incrémenter la version avec `python3 scripts/bump.py`.
- Lancer les contrôles locaux :
  ```bash
  python3 scripts/check_versions.py
  for file in *.js; do node --check "$file" || exit 1; done
  python3 -m compileall -q scripts
  ```
- Relire le diff avant de pousser.

## Messages de commit

Utiliser exclusivement le format :

```text
type(portee): description claire
```

Types : feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.

La description doit expliquer le changement réel, pas seulement dire qu'un fichier a été modifié.

## Pull Request

- Décrire le problème, la solution et les risques.
- Indiquer les tests réellement exécutés.
- Ajouter une capture pour une modification d'interface lorsque c'est utile.
- Ne pas fusionner tant que les vérifications obligatoires ne sont pas vertes.
