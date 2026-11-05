# Plan THP40

Application d'entraînement pour le Trail de Haute Provence (THP40). Page unique : `index.html`.

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
