# Kanban Cadenzo

Mis à jour le 25 nov. 2026. Pour ajouter un ticket : le demander à Claude.

## 🔴 À faire

### Bugs
- [ ] Segments : le catalogue partagé n'a que 13 segments (Toulon). Il faut que les utilisateurs synchronisent leurs segments pour couvrir d'autres régions (Edge Function gérée par l'autre session)

### À vérifier
- [ ] Test sur un vrai téléphone : cloche, plan, « Mes jours cette semaine », renfo en paysage
- [ ] Mode sombre : cloche, plan, trophées, séances guidées en paysage, onglet Renfo
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

### Moteur de plan : réalisme (toutes distances, tous niveaux)
À valider ensemble avant de coder. Les chiffres sont des ordres de grandeur de coaching, à tester sur 3 profils (débutant 10 km, régulier marathon, confirmé trail long).
- [ ] 1. Familles de course par km-effort (km + D+/100), pas par distance seule : 10 km, semi, marathon, trail court, trail moyen, trail long (plafond environ 80 km-effort, ultra hors périmètre)
- [ ] 2. Paramètres par famille : durée de plan, sortie longue max, affûtage (7 j à 3 sem.), séances clés
- [ ] 3. Plafonds selon le niveau : sortie longue d'un débutant 10 km à 60-75 min ; marathon débutant ~2h45 et 28 km max
- [ ] 4. Prérequis de base : un débutant doit courir régulièrement avant un marathon ou un trail moyen, sinon plan plus long ou refus
- [ ] 5. Alerte de réalisme : plan trop court pour la famille et le niveau, objectif trop ambitieux, avec proposition d'une course B ou d'un objectif plus doux
- [ ] 6. Trail en heures et D+ par heure (sortie longue en temps), route en km
- [ ] 7. Hors périmètre : pas d'ultra. Au-delà de 80 km-effort, l'app prévient et propose un objectif plus court ; trail long : sortie longue en heures, marche active, test du ravitaillement
- [ ] 8. Plafond de charge basé sur les 4 dernières semaines Strava, pas sur les km déclarés, avec limite de hausse par semaine
- [ ] 9. Recalcul des allures : après 3 séances au-dessus ou en dessous des cibles ; une séance isolée est ignorée
- [ ] 10. Bouton « Pas en forme » : un tap pour alléger la semaine (maladie, douleur, manque de temps), puis reprise progressive
- [ ] 11. Affûtage selon la distance de la course
- [ ] 12. Préparation spécifique trail : séances de descente, test du ravitaillement, marche active en montée
- [ ] 13. Route propre : sortie longue adaptée au 10 km, blocs à allure marathon ou semi, fini le squelette trail
- [ ] 14. Semaine flexible : 3 séances = 1 qualité + 1 longue + 1 facile ; fini les jours fixes mardi et week-end
- [ ] 15. Environ 80 % d'intensité facile : plafonner la qualité
- [ ] 16. Temps objectif comparé aux vrais records Strava (formule actuelle trop simple)
- [ ] 17. Relecture des règles par un coach pour les profils à risque (débutants, trail long)

### Améliorations
- [ ] Forme : à discuter, regrouper Strava et Garmin dans un seul dashboard (modules en plus si l'import Garmin est fait, Strava seul par défaut)
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
