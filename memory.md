# Mémoire — Features 16→19b + Week Planner Redesign (Option A)

Dernière mise à jour : 2026-06-22

## Ce qui a été créé

### Feature 16 — Vue Collaborateur — Mes Projets & Mise à jour de mes tâches
- `components/projects/CollaboratorProjectsView.tsx` — liste des projets du Collaborateur
- `components/projects/MyProjectCard.tsx` — carte projet avec progression
- `components/projects/MyAssignedTasksList.tsx` — tâches assignées avec `updateMyTaskProgress`
- `app/projects/page.tsx` — branche COLLABORATOR ajoutée
- `actions/projects.ts` — Server Action `updateMyTaskProgress()` (scope `responsibleUserId === session.user.id`)

### Feature 17 — Vue Collaborateur — Mes Comités
- `components/committees/CollaboratorCommitteesView.tsx`
- `components/committees/MyCommitteeCard.tsx`
- `components/committees/MyCommitteeActionsList.tsx`
- `app/committees/page.tsx` — branche COLLABORATOR ajoutée
- `actions/committees.ts` — `updateMyCommitteeActionStatus()` ajoutée

### Feature 18 — Rappels de Réunion
- `app/api/cron/meeting-reminder/route.ts` — cron complet (stub → vraie logique)
  - Requête Prisma : réunions avec `reminderSentAt: null` dans les 24h
  - `notifyUser()` pour chaque membre, `reminderSentAt` mis à jour après batch
  - Retourne `{ meetingsProcessed, membersNotified }`

### Feature 19 — Week Planner — UI complète (initialement)
- `components/week-planner/types.ts` — types partagés (`PlannedDay`, `TaskStatus`, `PlannerStatus`, `MockWeekTask`, `MockWeekPlanner`, `MockProject`, `MockMember`)
- `components/week-planner/TaskStatusBadge.tsx`
- `components/week-planner/WeekStatusBanner.tsx` — prop `validatorLabel?: string` (défaut "votre manager")
- `components/week-planner/AddTaskInline.tsx`
- `components/week-planner/WeekTaskCard.tsx`
- `components/week-planner/ManagerWeekPlannerView.tsx` — valide les Collaborateurs (liste + bouton jaune)

### Feature 19b — Manager a son propre Week Planner, validé par l'Admin (feature custom ajoutée)
- `components/week-planner/ManagerWeekPlannerFullView.tsx` — 2 onglets : "Mon Planning" + "Mon Équipe"
- `components/week-planner/AdminWeekPlannerView.tsx` — Admin valide les planners des Managers
- `components/layout/Sidebar.tsx` — "Week Planner" ajouté dans `ADMIN_NAV`
- `app/week-planner/page.tsx` — 3 branches : ADMIN → `AdminWeekPlannerView`, MANAGER → `ManagerWeekPlannerFullView`, COLLABORATOR → `CollaboratorWeekPlannerView`

### Redesign Option A — Vue jour unique avec navigation
**Remplace** la grille 5 colonnes + onglets "Ma semaine"/"Aujourd'hui" :
- `components/week-planner/WeekDayBar.tsx` — 5 boutons-jours cliquables, date + compteur + point couleur
- `components/week-planner/DayTaskPanel.tsx` — panneau unique par jour (planning si DRAFT, lecture si SUBMITTED, exécution si VALIDATED)
- `components/week-planner/CollaboratorWeekPlannerView.tsx` — réécrit : week nav + WeekStatusBanner + WeekDayBar + DayTaskPanel
- **Supprimés** : `WeekPlanningGrid.tsx`, `DailyExecutionView.tsx` (remplacés par le nouveau design)

## Décisions prises

- **Flux de validation à 2 niveaux** (custom, hors build-plan original) :
  - Collaborateur → SUBMITTED → Manager valide → VALIDATED
  - Manager → SUBMITTED → Admin valide → VALIDATED
  - Admin → valide uniquement, pas de planner propre
- **`validatorLabel?: string`** sur `WeekStatusBanner` et `CollaboratorWeekPlannerView` — permet d'afficher "votre manager" (Collaborateur) ou "l'Administrateur" (Manager)
- **`isEditable` vs `isExecutable`** dans `DayTaskPanel` : DRAFT seul = éditable (ajout/suppression tâches), VALIDATED seul = exécutable (statut/heures/commentaire), SUBMITTED = lecture seule
- **`key={activeDay}`** sur `DayTaskPanel` — recrée le composant à chaque changement de jour pour réinitialiser l'état d'exécution local
- **Semaines indépendantes** : naviguer vers une autre semaine reset le planner local à un DRAFT vide — seule la semaine courante (offset 0) montre le mock data initial
- **MOCK_MEMBERS** : "Valentine Agbekodo" renommée en "Carine Hounkpatin" pour éviter la confusion avec le Manager connecté dans les tests

## Problèmes résolus

- **SUBMITTED autorisait l'édition** : `isLocked = plannerStatus === "VALIDATED"` ne bloquait pas SUBMITTED → remplacé par `isEditable` (DRAFT) + `isExecutable` (VALIDATED)
- **Tâches de la semaine courante visibles sur les autres semaines** : `planner` state non réinitialisé sur navigation → `handleChangeWeek` reset maintenant `planner` à un DRAFT vide pour tout offset ≠ 0
- **Manager voyait son propre nom dans la liste de son équipe** : mock data `MOCK_MEMBERS` contenait "Valentine Agbekodo" (même nom que l'utilisateur connecté dans les tests) → renommé

## État actuel

- **Branch :** `dev`
- **Features complètes :** 1–19b + redesign Option A (sur 32 au total)
- **TypeScript :** 0 erreur — `npx tsc --noEmit` clean
- **Tout en mock data** — aucun appel DB dans le Week Planner, tout est `MockWeekPlanner` / `MockMember`
- **`WeekPlanningGrid.tsx` et `DailyExecutionView.tsx`** : supprimés
- **Fichiers de contexte mis à jour** : `context/progress-tracker.md` (features 18, 19, 19b marquées complètes)

## La prochaine session commencera par

Lancer **`/architect feature 20`** — Planification hebdomadaire — Logique :
- `getOrCreateWeekPlanner(weekStartDate)` — crée si inexistant (DRAFT) pour la semaine courante
- `addWeekPlannerTask(plannerId, { title, projectId, plannedDay })` — ajoute une tâche
- `deleteWeekPlannerTask(taskId)` — supprime une tâche (scope userId)
- `submitWeekPlanner(plannerId)` — DRAFT → SUBMITTED
- Brancher `CollaboratorWeekPlannerView` et `ManagerWeekPlannerFullView` sur les vraies Server Actions (remplacer mock data dans `page.tsx`)
- Couvre Collaborateur ET Manager (deux flux identiques, même DB)

## Questions en suspens

- Feature 21 (validation Manager + Admin) doit aussi implémenter le verrouillage des tâches via `prisma.$transaction` (décision déjà prise : atomique)
- Feature 22 (exécution quotidienne) doit alimenter la table `TimeEntry` pour le Suivi ETP (Phase 6)
- La navigation vers les semaines passées/futures en DB : décider si on charge depuis la DB à chaque `handleChangeWeek` ou si on utilise un Server Component séparé par semaine
