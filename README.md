# Cadenzo

Application d'entraînement pour le Trail de Haute Provence (THP40) et d'autres courses : plan sur 26 semaines, coach, mode Course, séances vers la montre. Elle s'installe sur le téléphone (Partager, Sur l'écran d'accueil) et marche hors ligne.

Fichiers : `index.html`, `style.css`, `data.js` (le plan), `app.js`, `fit.js` (séances .FIT pour la montre), `sw.js` (hors ligne). Les données restent sur le téléphone ; celles de l'ancienne version sont reprises automatiquement à la première ouverture.

## Strava sans Claude (à faire une seule fois)

1. **Strava** : sur strava.com/settings/api, mets `localhost` dans « Authorization Callback Domain ».
2. **Autorisation** : ouvre cette adresse dans ton navigateur en remplaçant `TON_CLIENT_ID`, puis clique sur Autoriser (laisse cochée la lecture des activités) :
   `https://www.strava.com/oauth/authorize?client_id=TON_CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all`
   La page qui s'ouvre ensuite affiche une erreur : c'est normal. Copie la valeur après `code=` dans l'adresse (jusqu'au `&`).
3. **Jeton GitHub** : sur github.com/settings/personal-access-tokens, crée un jeton « fine-grained », limité à ce dépôt, avec la permission *Secrets : Read and write*. Copie-le.
4. **Secrets** : dans ce dépôt, Settings, Secrets and variables, Actions, ajoute trois secrets :
   `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `GH_PAT` (le jeton de l'étape 3).
5. **Setup** : onglet Actions, « Strava setup », Run workflow, colle le code de l'étape 2.
6. **Sync** : onglet Actions, « Strava sync », Run workflow. Un fichier `activities.json` apparaît. Ensuite la synchro tourne toute seule toutes les 2 heures.

Le `client_secret` ne doit jamais être écrit dans un fichier du dépôt. `activities.json` contient seulement la date, les km, le D+ et le temps de chaque sortie, sans nom ni parcours GPS. Le dépôt étant public, ces données le sont aussi.

## Si la synchro Strava s'arrête

L'app l'affiche dans Réglages, Strava (« La lecture de Strava échoue sur GitHub »), et GitHub envoie un mail quand l'Action échoue. Les causes possibles :

- **Jeton Strava refusé** (accès retiré sur Strava, mot de passe changé) : refais les étapes 2 et 5.
- **`GH_PAT` expiré** (les jetons fine-grained ont une date de fin) : refais l'étape 3, remplace le secret `GH_PAT`, puis relance « Strava sync ». Choisis la durée la plus longue possible et note la date.
- **Synchro désactivée par GitHub** : GitHub coupe les tâches planifiées après 60 jours sans commit. Le script fait un petit commit au moins une fois par mois pour l'éviter. Si c'est arrivé quand même : onglet Actions, « Strava sync », Enable workflow.

Deux synchros ne tournent jamais en même temps, une erreur passagère de Strava est réessayée, et une réponse vide n'efface pas les sorties déjà publiées.
