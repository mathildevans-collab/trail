# Kanban Cadenzo

Mis à jour le 25 nov. 2026. Pour ajouter un ticket : le demander à Claude.

## 🔴 À faire

### Bugs
- [ ] Segments : le catalogue partagé n'a que 13 segments (Toulon). Il faut que les utilisateurs synchronisent leurs segments pour couvrir d'autres régions (Edge Function gérée par l'autre session)

### À vérifier
- [ ] Test sur un vrai téléphone : cloche, plan, « Mes jours cette semaine », renfo en paysage
- [ ] Mode sombre : cloche, plan, trophées, séances guidées en paysage
- [ ] Écrans ordinateur restants : Forme, Mes courses, détail d'une course

### Sécurité (haute)
- [ ] Couper les mails GitHub (à faire par toi) : bouton Watch du dépôt > Ignore, puis github.com/settings/notifications ; je pousse déjà directement sur `main`, sans PR
- [ ] Activer « Leaked password protection » dans Supabase (Authentication > Providers > Email)
- [ ] Décider de la purge de l'historique git (révoquer d'abord les secrets éventuels)
- [ ] Limite de 10 athlètes sur l'app Strava : demander une augmentation de quota

### Sécurité (moyenne)
- [ ] Edge Function `cadenzo-strava` : validation des entrées, limites de débit, messages d'erreur ; une seule source de vérité et déploiement via le CI
- [ ] Données locales après déconnexion : proposer « Effacer les données de cet appareil »
- [ ] Protéger la branche `main` dans GitHub (checks obligatoires)
- [ ] Sauvegardes Supabase : vérifier fréquence et rétention, tester une restauration

### Sécurité (basse)
- [ ] Index inutilisé `cadenzo_segment_efforts_user_activity_idx` : surveiller avant suppression
- [ ] Service worker : test de mise à jour (éviter un ancien cache cassé)
- [ ] Alertes sur les erreurs de l'Edge Function

### Tests
- [ ] Test de connexion Strava de bout en bout (impossible depuis l'environnement de Claude, à faire sur ton téléphone avec un second compte)
- [ ] Faire le point sur la PR #28 annulée d'une autre session (séparée du travail sur les séances route)

### Améliorations
- [ ] Écran « Séance terminée » en 2 colonnes en paysage

## 🟡 En cours

_(rien pour l'instant)_

## 🟢 Fait

- [x] Position corrigeable à la main dans les segments (le catalogue ne contient que 13 segments, tous autour de Toulon)
- [x] Filtre segments ≥ 4 % et ≥ 8 m vérifié avec des données simulées
- [x] Changement de jour de la fiche séance via le même mécanisme que le glisser-déposer
- [x] Courbe de charge et glisser-déposer dans le plan (ordinateur)
- [x] Cloche de notifications à la place de la photo
- [x] Segments : côtes à 4 % de pente et plus
- [x] Glisser-déposer des séances sur la bande « Aujourd'hui » (ordinateur)
- [x] Trophées et réglages revus sur ordinateur
- [x] Plan sur ordinateur : semaines en grille de 7 jours, sans défilement
- [x] Logo du menu ordinateur corrigé
- [x] « Mes jours cette semaine » corrigé sur mobile
- [x] Séances guidées de renfo et de mobilité en paysage

## ⛔ Volontaire, à ne pas toucher

- `cadenzo_get` / `cadenzo_put` : synchronisation chiffrée entre appareils (`csync.js`, `cadenzo_sync`), signalés par Supabase mais voulus
- Authentification et synchronisation Strava
- Profils existants (drapeau `legacy`) : ne pas les modifier, ne supprimer aucune fonctionnalité
