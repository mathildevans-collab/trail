# Cadenzo

Cadenzo est une application web progressive (PWA) dédiée à la course à pied et au trail. Elle aide à préparer les entraînements, suivre les activités et retrouver des segments. Elle peut être installée sur téléphone et propose un mode hors ligne.

## Lancer l'application en local

Le frontend est une application web statique : aucun serveur Node.js n'est nécessaire pour l'ouvrir.

1. Ouvrir le dépôt dans un éditeur de code.
2. Démarrer un serveur HTTP local à la racine (par exemple Live Server dans VS Code).
3. Ouvrir l'adresse locale dans un navigateur.
4. Pour tester Supabase et Strava, utiliser un compte de développement autorisé.

Ne pas ouvrir directement `index.html` avec `file://` : les modules web, l'authentification et le service worker nécessitent HTTP ou HTTPS.

## Où trouver le code ?

Le projet conserve pour le moment ses scripts principaux à la racine. Certains noms sont historiques : ils seront renommés uniquement après vérification de toutes leurs références.

| Fichier ou dossier | À quoi sert-il ? |
| --- | --- |
| `index.html` | Point d'entrée de l'application : structure des pages et chargement des scripts. |
| `style.css` | Mise en forme, couleurs, typographie et adaptation aux écrans. |
| `app.js` | Navigation, écrans et interactions principales. |
| `auth.js` | Connexion, session Supabase et autorisation Strava. |
| `csync.js` | Chiffrement et synchronisation des données entre appareils. |
| `safe.js` | Vérification, sauvegarde et fusion des données locales. |
| `data.js` | Données des plans et des séances d'entraînement. |
| `workout.js` | Affichage et déroulement des séances. |
| `fit.js` | Création et lecture des fichiers d'entraînement Garmin au format FIT. |
| `garmin.js` | Import et analyse des données exportées depuis Garmin. |
| `exo.js` | Affichage SVG des exercices et accès au catalogue. |
| `exo-data.js` | Dessins et positions des exercices de renforcement. |
| `exo-mob.js` | Dessins et positions des exercices de mobilité. |
| `exo-txt.js` | Consignes, muscles sollicités et erreurs à éviter. |
| `sw-reg.js` | Enregistrement du service worker dans le navigateur. |
| `sw.js` | Cache de l'application et fonctionnement hors ligne. |
| `supabase.min.js` | Bibliothèque officielle Supabase pour le navigateur. Ne pas modifier manuellement. |
| `fonts/`, `icon*/`, `manifest.webmanifest` | Polices, icônes et paramètres d'installation de la PWA. |
| `supabase/functions/cadenzo-strava/` | Code serveur des échanges OAuth Strava et des opérations sécurisées. |
| `supabase/migrations/` | Historique des changements de structure de la base de données. |
| `supabase/cadenzo_sync.sql` | Fonctions SQL utilisées pour la synchronisation chiffrée. |
| `scripts/` | Outils de maintenance et contrôles automatiques du dépôt. |
| `.github/workflows/` | Vérifications lancées automatiquement par GitHub Actions. |

### Principaux scripts de vérification

| Script | Contrôle effectué |
| --- | --- |
| `scripts/bump.py` | Met à jour les numéros de version utilisés par la PWA. |
| `scripts/check_versions.py` | Vérifie que les numéros de version sont identiques partout. |
| `scripts/check_asset_references.py` | Vérifie que les ressources chargées par la page et le cache existent. |
| `scripts/check_commit_messages.py` | Refuse les titres de commits vagues ou difficiles à comprendre. |
| `scripts/check_secrets.py` | Recherche les secrets qui auraient été ajoutés par erreur au dépôt. |

## Services utilisés

- **GitHub Pages** héberge le frontend.
- **Supabase** fournit l'authentification, la base de données et la fonction Edge `cadenzo-strava`.
- **Strava** fournit l'autorisation OAuth et les données auxquelles l'application a accès.

Le frontend et les fonctions Supabase sont déployés séparément. Modifier un fichier dans `supabase/functions/` ne met pas automatiquement à jour le site, et inversement.

### Secrets et configuration serveur

Les secrets doivent être enregistrés dans les paramètres Supabase, jamais dans le dépôt :

- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_TOKEN_ENCRYPTION_KEY`

La clé de chiffrement doit rester stable pour permettre de déchiffrer les jetons déjà enregistrés. Ne jamais la remplacer sans procédure de migration préparée et testée.

La clé publique Supabase destinée au navigateur n'est pas une clé d'administration. La clé `service_role`, les secrets OAuth, les jetons d'accès et les données personnelles ne doivent jamais être publiés.

## Versions de l'application

La version frontend est actuellement présente dans `app.js`, `index.html`, `auth.js` et `sw.js), notamment pour gérer le cache PWA.

Après une modification du frontend, lancer :

```bash
python3 scripts/bump.py
python3 scripts/check_versions.py
```

La vérification automatique bloque les versions incohérentes.

## Règles de travail sur Git

La branche `main` est la version de référence. Toute évolution doit passer par une branche dédiée et une Pull Request.

1. Créer une branche dont le nom décrit le sujet : `correction/...`, `amelioration/...`, `documentation/...` ou `securite/...`.
2. Limiter la branche à un seul changement cohérent.
3. Écrire chaque titre de commit en français, avec une phrase naturelle et un verbe d'action.
4. Décrire le problème, les changements, les tests et les risques dans la Pull Request.
5. Attendre la réussite de tous les contrôles automatiques avant la fusion.
6. Ne jamais fusionner si un contrôle obligatoire échoue.

### Exemples de titres de commits

- `Corrige la recherche des segments proches`
- `Ajoute le choix du nombre de séances à l'inscription`
- `Évite de perdre la session après une mise en veille`
- `Explique comment connecter son compte Strava`
- `Vérifie les fichiers utilisés par le mode hors ligne`

Un titre doit permettre de comprendre le changement sans ouvrir les fichiers. Éviter les intitulés vagues comme `update`, `fix bug`, `correction`, `test` ou `modifications diverses).

## Vérifications automatiques

À chaque Pull Request, GitHub Actions vérifie notamment :

- la syntaxe des fichiers JavaScript ;
- la cohérence des versions PWA ;
- la présence des fichiers utilisés par l'application et le mode hors ligne ;
- la syntaxe des scripts Python ;
- la clarté des titres de commits ;
- la présence de secrets manifestes dans les fichiers.

Un résultat vert est nécessaire avant fusion. Il ne remplace pas les tests réels sur téléphone, les essais OAuth avec Strava ni l'audit des règles d'accès RLS.

## Sécurité et protection des données

- Ne jamais ajouter de fichier `.env`, de secret, de jeton OAuth ou de donnée personnelle au dépôt.
- Ne jamais désactiver la RLS pour contourner un problème d'accès.
- Toute nouvelle table accessible depuis le client doit avoir des règles RLS explicites.
- Toute évolution SQL doit être ajoutée dans `supabase/migrations/` avec un nom daté et explicite.
- Ne jamais supprimer les données de production pour corriger un bug.
- Tester les changements d'authentification et de synchronisation avant leur mise en production.

## Déploiement

Le frontend est publié par GitHub Pages. Les fonctions Edge sont déployées séparément sur Supabase. Une modification ne doit être mise en production qu'après les contrôles CI et la validation des changements concernés.

En cas d'incident, identifier la version du frontend et celle de la fonction Edge, consulter les journaux, puis revenir à la dernière version stable si nécessaire. Éviter d'enchaîner des déploiements correctifs qui n'ont pas été testés.
