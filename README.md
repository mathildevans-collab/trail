# Cadenzo

Cadenzo est une application web progressive (PWA) dédiée à la course à pied et au trail. Elle permet de préparer ses entraînements, suivre ses activités et retrouver ses segments. L'application peut être installée sur téléphone et dispose d'un mode hors ligne.

## Démarrer

Le projet est une application web statique : aucun serveur Node.js n'est nécessaire pour l'utiliser.

1. Ouvrir le dépôt dans un éditeur de code.
2. Servir le dossier racine avec un serveur HTTP local (par exemple l'extension Live Server de VS Code).
3. Ouvrir l'adresse locale dans un navigateur.
4. Pour tester les connexions, utiliser un compte de développement autorisé et les services configurés dans Supabase et Strava.

Ne pas ouvrir directement `index.html` avec `file://` : les modules web, l'authentification et le service worker nécessitent un contexte HTTP/HTTPS.

## Architecture actuelle

Le dépôt conserve volontairement une structure simple tant que les dépendances entre les scripts n'ont pas été migrées.

| Chemin | Rôle |
| --- | --- |
| Fichier | Rôle |
| --- | --- |
| `index.html` | Page d'entrée. Déclare les écrans, la navigation et l'ordre de chargement des scripts. |
| `style.css` | Apparence de l'application : couleurs, typographie, composants et adaptation mobile/ordinateur. |
| `data.js` | Données du plan d'entraînement : semaines, séances, zones et contenus associés. |
| `fit.js` | Création et lecture des fichiers d'entraînement Garmin au format FIT. |
| `safe.js` | Validation, sauvegarde et fusion des données locales pour éviter les pertes. |
| `csync.js` | Chiffrement et synchronisation des données entre appareils. |
| `garmin.js` | Import et analyse des données exportées depuis Garmin. |
| `exo.js` | Moteur de dessin SVG et catalogue central des exercices. |
| `exo-data.js` | Positions et dessins des exercices de renforcement. |
| `exo-mob.js` | Positions et dessins des exercices de mobilité. |
| `exo-txt.js` | Consignes, muscles sollicités et erreurs à éviter pour chaque exercice. |
| `workout.js` | Affichage et déroulement des séances d'entraînement. |
| `auth.js` | Connexion utilisateur, session Supabase et autorisation Strava. |
| `sw-reg.js` | Enregistrement du service worker dans le navigateur. |
| `sw.js` | Mise en cache des fichiers et fonctionnement hors ligne. |
| `app.js` | Assemblage de l'application : navigation, écrans, interactions et logique principale. |
| `supabase.min.js` | Bibliothèque officielle Supabase utilisée dans le navigateur. Ne pas modifier manuellement. |
| `scripts/bump.py` | Met à jour ensemble les numéros de version du frontend et du cache PWA. |
| `scripts/check_versions.py` | Vérifie que les numéros de version sont identiques partout. |
| `scripts/check_asset_references.py` | Vérifie que les fichiers chargés par la page et le cache hors ligne existent. |
| `scripts/check_commit_messages.py` | Refuse les titres de commits trop vagues ou illisibles. |
| `scripts/check_secrets.py` | Recherche les secrets qui auraient été écrits en clair dans le dépôt. |
| `.github/workflows/check.yml` | Lance automatiquement les vérifications à chaque Pull Request et sur `main`. |
| `supabase/functions/cadenzo-strava/index.ts` | Traitement serveur des connexions Strava et des demandes sécurisées. |
| `supabase/migrations/` | Historique des évolutions de la base de données. |
| `supabase/cadenzo_sync.sql` | Fonctions SQL utilisées pour la synchronisation chiffrée. |
| `supabase/functions/cadenzo-strava/` | Fonction serveur pour OAuth Strava et opérations sécurisées. |
| `supabase/migrations/` | Évolutions versionnées du schéma de base de données. |
| `supabase/cadenzo_sync.sql` | SQL de synchronisation entre appareils. |
| `scripts/` | Scripts de maintenance et contrôles du dépôt. |
| `.github/workflows/` | Vérifications automatiques GitHub Actions. |
| `fonts/`, `icon*`, `manifest.webmanifest` | Polices, icônes et configuration PWA. |

Les noms historiques courts seront clarifiés progressivement, après vérification de tous les imports, références HTML, chemins du service worker et caches. Ne pas renommer ces fichiers manuellement sans mettre à jour toutes leurs références.

## Services externes

- **GitHub Pages** héberge le frontend statique.
- **Supabase** fournit Auth, la base de données et la fonction Edge `cadenzo-strava`.
- **Strava** fournit l'autorisation OAuth et les données auxquelles l'application a accès.

La fonction Edge est déployée séparément du frontend. Une modification dans `supabase/functions/` ne met pas automatiquement à jour GitHub Pages, et inversement.

### Configuration serveur

Les secrets doivent être configurés dans les paramètres Supabase de la fonction, jamais dans le dépôt :

- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_TOKEN_ENCRYPTION_KEY`

La clé de chiffrement doit rester stable pour pouvoir déchiffrer les jetons déjà stockés. Ne jamais la régénérer sans procédure de migration planifiée.

Les URL publiques et clés anon destinées au navigateur ne sont pas des secrets d'administration. La clé `service_role`, les secrets OAuth, les jetons d'accès/renouvellement et les données personnelles ne doivent jamais être publiés.

## Versions de l'application

La version frontend est actuellement répliquée dans `app.js`, `index.html`, `auth.js` et `sw.js` pour gérer le cache PWA.

Après une modification frontend, lancer :

```bash
python3 scripts/bump.py
python3 scripts/check_versions.py
```

Le contrôle automatique bloque les incohérences de version.

## Workflow Git obligatoire

La branche `main` représente la version de référence. Toute évolution doit passer par une branche dédiée et une Pull Request.

1. Créer une branche dont le nom décrit le sujet : `correction/...`, `amelioration/...`, `documentation/...` ou `securite/...`.
2. Limiter chaque branche à un seul changement cohérent.
3. Écrire des titres de commits en français, courts et concrets.
4. Ouvrir une Pull Request vers `main` avec une explication du problème et des vérifications faites.
5. Attendre le succès de toutes les vérifications GitHub Actions.
6. Ne jamais fusionner une Pull Request dont un contrôle obligatoire est en échec.

### Titres des commits

Le titre doit expliquer ce qui change sans avoir besoin d'ouvrir les fichiers. Écrire une phrase naturelle, avec un verbe d'action.

Exemples :

- `Corrige la recherche des segments proches`
- `Ajoute le choix du nombre de séances à l'inscription`
- `Décrit le lancement de Cadenzo dans le guide`
- `Vérifie les fichiers utilisés par le mode hors ligne`
- `Évite de perdre la session après une mise en veille`

Éviter les titres vagues ou artificiels : `update`, `correction`, `test`, `modifs`, `fix bug`, `améliorations diverses`.

Les anciens titres préfixés comme `fix(segments): ...` restent acceptés pendant la transition, pour ne pas bloquer les branches déjà existantes. Les nouveaux commits doivent utiliser les phrases françaises ci-dessus.

## Vérifications automatiques

Le workflow GitHub Actions contrôle les commits proposés, la syntaxe JavaScript, la cohérence des versions, les scripts Python et la présence de secrets manifestes dans les fichiers du dépôt.

Un contrôle vert est obligatoire avant fusion. Il ne remplace pas les tests fonctionnels sur téléphone, les tests OAuth réels ni une revue de sécurité des politiques RLS.

## Sécurité et données

- Ne jamais committer de fichier `.env`, secret, jeton OAuth ou export de données utilisateur.
- Ne jamais désactiver la RLS pour contourner un problème d'accès.
- Toute nouvelle table exposée au client doit avoir des politiques RLS explicites.
- Toute migration SQL doit être ajoutée dans `supabase/migrations/` avec un nom daté et descriptif.
- Ne jamais supprimer ou purger les données de production pour corriger un bug.
- Tester les changements d'authentification et de synchronisation avant leur mise en production.

## Déploiement

Le frontend est publié via GitHub Pages selon la configuration du dépôt. Les fonctions Edge Supabase sont déployées séparément. Le déploiement de production doit être effectué uniquement après les contrôles CI et une validation des changements concernés.

En cas d'incident, identifier d'abord la version frontend et la version Edge actives, consulter les journaux, puis revenir à la dernière version stable si nécessaire. Ne pas multiplier les déploiements correctifs non testés.
