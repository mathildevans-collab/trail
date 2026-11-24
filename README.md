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
| `index.html` | Point d'entrée HTML de l'application et chargement des ressources. |
| `style.css` | Styles, composants visuels et responsive design. |
| `app.js` | Initialisation et logique principale de l'application. |
| `auth.js` | Authentification Supabase et connexion Strava. |
| `csync.js` | Synchronisation des données entre appareils. |
| `data.js` | Données et fonctions liées au stockage applicatif. |
| `fit.js` | Fonctions liées aux fichiers et données FIT. |
| `garmin.js` | Intégration Garmin. |
| `safe.js` | Fonctions de sécurité et de protection des données côté client. |
| `workout.js` | Gestion des entraînements. |
| `exo*.js` | Données et affichage des exercices. |
| `sw.js`, `sw-reg.js` | Cache hors ligne et enregistrement du service worker. |
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

1. Créer une branche courte : `feat/...`, `fix/...`, `docs/...`, `refactor/...` ou `chore/...`.
2. Faire des changements limités à un sujet.
3. Écrire des commits explicites au format Conventional Commits.
4. Ouvrir une Pull Request vers `main`.
5. Attendre le succès de toutes les vérifications GitHub Actions.
6. Corriger les contrôles en échec avant toute fusion.

### Format des commits

Format recommandé :

```text
type(portee): description courte à l'impératif
```

Types acceptés : `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

Exemples :

- `fix(segments): corrige le calcul de distance GPS`
- `feat(onboarding): ajoute le choix du nombre de séances`
- `docs(readme): décrit le lancement local`
- `ci(github): vérifie les messages de commit`
- `refactor(auth): centralise le renouvellement de session`

Éviter les messages comme `update`, `correction`, `test`, `modifs`, `fix bug` ou `améliorations diverses`. Préférer `Corrige la recherche des segments proches`.

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
