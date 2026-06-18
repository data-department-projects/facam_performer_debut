# Build Plan — FACAM PERFORMER

## Principe Fondamental

UI complète construite avec des données fictives d'abord — vérifiée visuellement avant toute logique. La logique est ensuite branchée étape par étape sur chaque écran déjà validé. Chaque fonctionnalité doit être visible et testable avant de passer à la suivante. Aucune phase backend invisible.

Hypothèse structurante : le système gère une seule entité (FACAM STAIRWAY), donc pas de logique multi-tenant à prévoir.

---

## Phase 1 — Fondations

### 01 Page d'accueil & Connexion — UI

**UI :**
- Page de connexion — champs email / mot de passe, lien "Mot de passe oublié"
- Page d'accueil interne post-connexion (placeholder redirigeant vers le tableau de bord)
- Pas d'auto-inscription : les comptes sont créés par l'Administrateur

### 02 Authentification (email + mot de passe) — Logique

**Logique :**
- Authentification par credentials (Auth.js / NextAuth v5), hash des mots de passe (bcrypt, coût 12)
- Flux "mot de passe oublié" par OTP : code à 6 chiffres envoyé par email (template fourni), expiration 10 minutes, usage unique — jamais de lien
- Toute nouvelle demande invalide les codes précédents non utilisés du même utilisateur
- Session JWT incluant rôle (Admin / Manager / Collaborateur) et département — un seul rôle actif à la fois (Règle 2)
- Middleware protégeant toutes les routes selon le rôle et la matrice de permissions par module
- Redirection post-connexion vers le tableau de bord adapté au rôle

### 03 Service d'emails transactionnels (Resend) — Logique

**Logique :**
- Client Resend configuré (lib/email.ts)
- Templates fournis par le client intégrés : réinitialisation par OTP ("otp-reset"), envoi des identifiants à la création de compte ("credentials")
- Job planifié (Vercel Cron) — rappel quotidien aux collaborateurs n'ayant pas mis à jour leurs tâches du jour
- Job planifié — rappel hebdomadaire le vendredi à 15h pour la validation du Week Planner de la semaine suivante

### 04 Schéma de base de données — PostgreSQL

**Logique :**
- Tables : User, PasswordResetToken, PushSubscription, Department, SubDepartment, Team, Project, ProjectTeamMember, ProjectMilestone, GanttTask, Committee, CommitteeDepartment, CommitteeMember, CommitteeMeeting, CommitteeAction, WeekPlanner, WeekPlannerTask, TimeEntry, Objective, DepartmentObjective, Attachment, BugReport
- Contrainte : tout utilisateur doit appartenir à un département (Règle 3), pas d'exception en base
- Contrainte : un projet a un Chef de Projet unique (`projectManagerId`) mais plusieurs membres d'équipe (Règle 5)
- Pas d'historique détaillé des modifications : les données validées ne conservent que la dernière version (Règle 13)
- Index sur les colonnes de filtrage fréquent (userId, departmentId, projectId, weekPlannerId)

### 05 Stockage S3 & Permissions de base — Logique

**Logique :**
- Bucket AWS S3 pour les justificatifs et livrables (accès authentifié uniquement)
- Implémentation de la matrice Modules × Rôles définie dans le cahier des charges sous forme de garde-fous réutilisables (`lib/permissions.ts` — `requireRole()`)
- Tests de la matrice sur chaque module avant de les construire (accès complet / selon permissions / consultation limitée / aucun)

### 06 Préférences de Notifications & Infrastructure Push — UI & Logique

**UI :**
- Bandeau de consentement (NotificationPermissionPrompt.tsx) — boutons "Activer les notifications" / "Plus tard"
- Affiché tant que `notificationConsent = NOT_ASKED`, jamais en modale bloquante

**Logique :**
- Génération des clés VAPID (une seule fois, stockées en variables d'environnement)
- Service Worker (`public/sw.js`) — réception et affichage des notifications push
- `lib/push-client.ts` — enregistrement du Service Worker + abonnement `PushManager` côté navigateur
- POST `/api/push/subscribe` — sauvegarde `PushSubscription`, passe `notificationConsent` à `ACCEPTED`
- POST `/api/push/unsubscribe` — supprime l'abonnement, passe `notificationConsent` à `DECLINED`
- `lib/web-push.ts` — envoi serveur via `web-push` (VAPID)
- `lib/notify.ts` (`notifyUser()`) — point d'entrée unique : push si consentement accepté et abonnement actif, sinon email — jamais les deux canaux pour le même événement

---

## Phase 2 — Organigramme

### 07 Organigramme — UI complète

**UI :**
- Vue arborescente : Départements → Sous-départements → Équipes → Collaborateurs (données mock)
- Fiche détail d'un nœud — responsable, effectif, sous-éléments
- Vue Admin : boutons création/édition de nœuds. Vue Manager/Collaborateur : consultation limitée à leur périmètre

### 08 Organigramme — Logique

**Logique :**
- CRUD départements / sous-départements / équipes (Admin uniquement)
- Structure hiérarchique exploitable pour déterminer le périmètre de supervision d'un manager (Règle 4 : départements → sous-départements → équipes)
- Suppression d'un nœud bloquée s'il contient encore des utilisateurs rattachés

---

## Phase 3 — Administration

### 09 Administration — UI complète

**UI :**
- Liste des utilisateurs — filtre par département/rôle, statut actif/inactif
- Formulaire création/édition utilisateur — nom, email, rôle unique, rattachement département/équipe (obligatoire)
- Champ mot de passe avec bouton "Générer un mot de passe aléatoire" — remplit le champ avec un mot de passe sécurisé
- Bouton "Envoyer les identifiants" sur le même formulaire — déclenche l'envoi par email de l'email + mot de passe courant du champ
- Écran de configuration des permissions par module (lecture de la matrice, ajustement des cas "selon permissions")

### 10 Administration — Logique

**Logique :**
- CRUD utilisateurs — un seul rôle actif par utilisateur (Règle 2), rattachement département obligatoire à la création (Règle 3)
- `generateRandomPassword()` — génération côté navigateur, pré-remplit uniquement le champ du formulaire
- `sendUserCredentials()` — hash et persiste le mot de passe courant du formulaire, puis envoie le template "credentials" par email — le mot de passe en clair ne transite que dans cette requête, jamais stocké ni loggé
- Désactivation de compte (pas de suppression physique pour préserver l'intégrité des données historiques)
- Sauvegarde des ajustements de permissions ("selon permissions" pour Manager/Collaborateur sur Gantt, Projets, Objectifs, Objectifs Départements)

---

## Phase 4 — Projets, Planification (Gantt) & Comités

### 11 Module Projets & Gantt — UI complète

**UI :**
- Liste des projets — code (PRJ-2026-001), nom, Chef de Projet, statut opérationnel, indicateur confirmé/non confirmé, % avancement (mock)
- Formulaire création de projet en 5 sections : Identité (catégorie, priorité stratégique), Gouvernance (sponsor, chef de projet, équipe avec rôles, bénéficiaire interne/externe), Cadrage Temporel (dates estimées/réelles, jalons), Financier (budget initial/consommé, jours-homme, dépenses externes), Spécifications (périmètre inclus/exclus, livrables, critères de succès, liens documentation)
- Vue Gantt — tâches, dates, dépendances (données mock)
- Option d'import du planning via template Excel

### 12 Création de projet & planning Gantt — Logique (Manager)

**Logique :**
- Génération automatique du code projet (`PRJ-{année}-{séquence}`)
- Le Manager crée le projet, désigne un Chef de Projet unique et ajoute plusieurs membres d'équipe avec rôle (Règle 5)
- Un collaborateur peut être membre de plusieurs projets simultanément (Règle 6)
- Création des tâches du Gantt, jalons (ProjectMilestone) et livrables associés au projet
- Import du planning depuis un fichier Excel basé sur le template fourni
- `isConfirmed = false` par défaut à la création

### 13 Confirmation des projets — Logique (Administrateur principal)

**Logique :**
- L'Administrateur consulte la fiche projet complète et passe `isConfirmed` à `true`, ou laisse une `confirmationNote` si le projet reste en attente
- Un projet non confirmé n'apparaît pas comme option de rattachement de tâche dans le Week Planner (Règle 10)
- Pas d'état "Rejeté" distinct — le projet reste modifiable et peut être resoumis à la confirmation
- `currentStatus` (cycle de vie opérationnel) reste indépendant de `isConfirmed`

### 14 Comités — UI complète

**UI :**
- Formulaire création de comité — nom, responsable, objectifs, fréquence (mensuel/annuel/trimestriel/hebdomadaire/ponctuel), départements inclus, participants, invités
- Calendrier des réunions planifiées par comité
- Formulaire de planification de réunion — date, date de début, date de fin, lien de connexion
- Liste des actions décidées par réunion — responsable, échéance, statut
- Indicateur "Taux de réalisation des décisions" par comité

### 15 Comités — Logique

**Logique :**
- Création du comité avec ses départements inclus et ses membres (Participants / Invités)
- Planification d'une réunion liée au comité — date, créneau, lien de connexion optionnel
- Création des actions décidées lors d'une réunion précise, assignation à un responsable, échéance
- Suivi de statut des actions et calcul automatique du taux de réalisation des décisions

### 16 Vue Collaborateur — Mes Projets & Mise à jour de mes tâches

**UI :**
- Liste des projets où le Collaborateur est membre d'équipe — informations en lecture (nom, description, dates, Chef de Projet)
- Liste "Mes tâches assignées" (MyAssignedTasksList) — tâches Gantt où il est responsable, avec contrôle simple de mise à jour de l'avancement

**Logique :**
- `updateMyTaskProgress()` — met à jour uniquement `progressPercent`, restreint aux tâches où `responsibleUserId === session.user.id`
- Jamais d'accès aux dates, dépendances ou au reste de la fiche projet en édition

### 17 Vue Collaborateur — Mes Comités

**UI :**
- Liste des comités dont le Collaborateur est membre (Participant ou Invité) — nom, objectifs, fréquence
- Prochaine réunion planifiée par comité — date, créneau, lien de connexion

**Logique :**
- Requête `CommitteeMember` filtrée par `userId` courant — lecture uniquement, aucune action de modification disponible

### 18 Rappels de Réunion — Email ou Notification Push

**Logique :**
- Cron `/api/cron/meeting-reminder` — recherche les `CommitteeMeeting` dans les 24h dont `reminderSentAt` est vide
- Pour chaque réunion, récupère tous les `CommitteeMember` (Participants + Invités)
- Pour chaque membre, `notifyUser()` envoie un push si consentement accepté et abonnement actif, sinon un email
- `reminderSentAt` mis à jour après l'envoi du lot, même si certains envois individuels échouent

---

## Phase 5 — Week Planner

### 19 Week Planner — UI complète

**UI :**
- Vue "Planification de la semaine" — ajout de tâches (liées à un projet confirmé ou hors-projet), répartition par jour
- Vue "Exécution quotidienne" — liste des tâches du jour avec statut (Débuté / En cours / Terminé / Non terminé)
- Champ commentaire obligatoire visible dès sélection de "Non terminé"
- Bouton "Valider la semaine" (Manager) et indicateur de verrouillage une fois validée

### 20 Planification hebdomadaire — Logique

**Logique :**
- Création/édition du Week Planner par le collaborateur tant qu'il n'est pas validé
- Ajout de tâches rattachées à un projet confirmé existant ou tâches hors-projet (Règle 11)
- Soumission du planning de la semaine pour validation par le Manager

### 21 Validation du Week Planner — Logique (Manager)

**Logique :**
- Le Manager valide le Week Planner de chaque membre de son périmètre
- Une fois validée, la semaine devient non modifiable (Règle 8) — toute correction nécessite la création d'une nouvelle planification
- Déclenchement de la visibilité des tâches du jour uniquement après validation (Règle 9)

### 22 Exécution quotidienne & déclaration du temps — Logique

**Logique :**
- Mise à jour du statut de chaque tâche du jour par le collaborateur
- Commentaire obligatoire bloquant la sauvegarde si le statut est "Non terminé" (Règle 12)
- Déclaration du temps passé par activité/tâche (alimente le Suivi ETP en Phase 6)
- Mise à jour automatique de l'avancement du projet lié, si applicable

---

## Phase 6 — Suivi ETP & Temps de travail

### 23 Suivi ETP & Temps — UI complète (Administrateur)

**UI :**
- Tableau consolidé du temps déclaré par collaborateur / département / activité (mock data)
- Indicateur de charge (ETP consommé vs disponible) par équipe
- Filtre par période (semaine, mois, trimestre)
- Boutons d'export PDF et CSV

### 24 Suivi ETP & Temps — Logique

**Logique :**
- Agrégation des temps déclarés issus de l'exécution quotidienne du Week Planner (Phase 5)
- Calcul du taux d'occupation / ETP par collaborateur et par département
- Module réservé à l'Administrateur — aucun accès Manager ou Collaborateur
- Export PDF (@react-pdf/renderer) et CSV (génération native), réservés au rôle Administrateur

---

## Phase 7 — Objectifs

### 25 Objectifs individuels — UI complète

**UI :**
- Formulaire de création d'objectif — nom, description, type (Objectif de performance / Objectif de développement des compétences), fréquence (annuel / trimestriel / mensuel)
- Section "Résultats clés" — ajout d'un ou plusieurs résultats clés par objectif, chacun avec sa description, sa valeur cible chiffrée si applicable (ex. "3 nouveaux clients", "50 produits vendus") et sa date limite
- Section "Risques" — liste libre des risques associés à l'objectif, saisie à la création pour anticiper les surprises en cours de période
- Vue collaborateur — modification de l'état de chaque résultat clé (Non démarré / En cours / Terminé), saisie de la valeur atteinte et de la preuve (noms de clients, chiffres atteints, ou upload de certificat pour les objectifs de développement des compétences)
- Vue Manager — suivi en lecture des objectifs de son périmètre (selon permissions accordées en Phase 3)

### 26 Objectifs individuels — Logique

**Logique :**
- CRUD des objectifs (nom, description, type, risques, fréquence) par le collaborateur propriétaire uniquement
- CRUD des résultats clés rattachés — un objectif peut avoir plusieurs résultats clés
- Mise à jour du statut, de la valeur atteinte et de la preuve d'un résultat clé, réservée au collaborateur propriétaire de l'objectif
- Upload de certificat (objectifs de développement des compétences) vers S3, rattaché au résultat clé via Attachment
- Visibilité Manager conditionnée par la configuration des permissions (module Administration) — toujours en lecture, jamais en modification

### 27 Objectifs Départements — UI & Logique

**UI & Logique :**
- Consolidation des objectifs au niveau département, accès complet Administrateur
- Accès Manager selon configuration des permissions (pas d'accès Collaborateur)
- Agrégation automatique calculée à partir du statut des résultats clés (% de résultats clés `DONE`) des objectifs individuels du département concerné

---

## Phase 8 — Actions à traiter

### 28 Actions à traiter — UI complète

**UI :**
- Liste centralisée des éléments en attente : projets à confirmer, Week Planners à valider, actions de comité en retard (mock data)
- Vue Administrateur — flux global. Vue Manager — flux limité à son équipe

### 29 Actions à traiter — Logique

**Logique :**
- Agrégation en temps réel des flux issus des Phases 4 (Projets, Comités) et 5 (Week Planner)
- Génération d'alertes sur retards, tâches récurrentes "Non terminé", ou surcharge détectée via le Suivi ETP
- Filtrage automatique "Flux de son équipe" pour le rôle Manager, aucun accès pour le Collaborateur

---

## Phase 9 — Tableau de bord

### 30 Tableau de bord — UI complète

**UI :**
- KPIs (mock) : taux d'exécution des tâches, respect des délais, productivité par collaborateur/département, charge de travail par équipe, avancement des projets, taux de réalisation des décisions de comités
- Vue Administrateur — globale. Vue Manager — selon périmètre. Vue Collaborateur — personnelle uniquement

### 31 Tableau de bord — Logique

**Logique :**
- Calcul des indicateurs à partir des données réelles : Week Planner, Projets/Gantt, Comités, Objectifs, Suivi ETP
- Requêtes de consolidation optimisées côté serveur pour respecter le temps de réponse ≤ 3 secondes même à 100 utilisateurs simultanés
- Filtrage des données selon le rôle et le périmètre de l'utilisateur connecté

---

## Phase 10 — Accueil / Guide / Support

### 32 Guide utilisateur & Remontée de bugs — UI & Logique

**UI :**
- Page d'aide/FAQ statique par rôle
- Formulaire de remontée de bug — accessible à tous les rôles

**Logique :**
- Envoi du formulaire de bug par email (Resend) à l'équipe support, ou stockage en base pour suivi interne

---

## Récapitulatif des fonctionnalités

| Phase | Fonctionnalités |
|---|---|
| Phase 1 — Fondations | 6 |
| Phase 2 — Organigramme | 2 |
| Phase 3 — Administration | 2 |
| Phase 4 — Projets, Gantt & Comités | 8 |
| Phase 5 — Week Planner | 4 |
| Phase 6 — Suivi ETP & Temps | 2 |
| Phase 7 — Objectifs | 3 |
| Phase 8 — Actions à traiter | 2 |
| Phase 9 — Tableau de bord | 2 |
| Phase 10 — Accueil / Guide / Support | 1 |
| **Total** | **32** |
