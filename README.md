# Cadenzo

Application d'entraînement (plan, coach, mode Course, séances vers la montre) pour le THP40 et d'autres courses. Elle s'installe sur le téléphone (Partager, Sur l'écran d'accueil) et fonctionne hors ligne.

## Architecture

- **Application** : fichiers statiques (GitHub Pages). Les données personnelles restent chiffrées/stockées sur l'appareil ; `supabase.min.js` est servi par le site (aucun script tiers).
- **Connexion** : obligatoire, avec son propre compte Strava (OAuth). Supabase Auth gère les sessions ; un compte Supabase = un athlète Strava.
- **Serveur** : fonction Supabase `cadenzo-strava` (`supabase/functions/cadenzo-strava/index.ts`). Le secret Strava et la clé de chiffrement n'existent que dans les secrets de la fonction : `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_TOKEN_ENCRYPTION_KEY` (32 octets en base64).
- **Isolation** : toutes les tables `cadenzo_*` ont la RLS activée ; l'application ne peut lire que les lignes de son propre `user_id`, jamais écrire. Les jetons Strava (chiffrés AES-GCM) et les états OAuth ne sont lisibles par aucun client.
- **Strava** : « Authorization Callback Domain » = `psotpksrdlkivauxdiad.supabase.co`. Droits demandés : `read,activity:read_all,profile:read_all`.

## Mise à jour

`python3 scripts/bump.py` incrémente le numéro de version partout (index.html, sw.js, auth.js, APPV). L'application se met à jour toute seule à l'ouverture suivante.

## Sécurité

Voir `supabase/cadenzo_sync.sql` (synchro chiffrée entre appareils) et la politique CSP dans `index.html`. Ne jamais écrire de clé `service_role`, de secret Strava ou de jeton dans le dépôt.
