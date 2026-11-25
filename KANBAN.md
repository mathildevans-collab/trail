# Kanban Cadenzo

Mis à jour le 25 nov. 2026. Pour ajouter un ticket : le demander à Claude.

## 🔴 À faire

### Bugs
- [ ] Position « Toulon » bloquée : rafraîchir la liste de segments en cache avec la position réelle
- [ ] Segments : tester le filtre (pente ≥ 4 %, D+ ≥ 8 m) sur de vraies données
- [ ] Fiche séance : le changement de jour peut être écrasé pour les profils configurés (passer par le mécanisme du glisser-déposer)

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
- [ ] Courbe de charge dans le plan
- [ ] Glisser-déposer des séances dans le plan (ordinateur)
- [ ] Écran « Séance terminée » en 2 colonnes en paysage

## 🟡 En cours

_(rien pour l'instant)_

## 🟢 Fait

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
