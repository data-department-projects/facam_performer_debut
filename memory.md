# Mémoire — Features 1→30 complètes, prochaine : Feature 31

Dernière mise à jour : 2026-06-23

## Ce qui a été créé

### Features 1–27 (acquis de la session précédente)
Tout le socle est en place : auth, emails, schéma DB, S3, push VAPID, organigramme, administration, projets + Gantt, comités, vues Collaborateur, rappels de réunion, Week Planner complet (UI + Logique), Suivi ETP (UI + Logique), Objectifs individuels + Résultats clés (UI + Logique), Objectifs Départements.

### Feature 28 — Actions à traiter — UI complète
- `components/actions-to-process/types.ts` — types partagés (`PendingProject`, `PendingWeekPlanner`, `OverdueCommitteeAction`, `ActionsToProcessData`)
- `lib/mock/actions-to-process.ts` — mock data typée
- `components/actions-to-process/ActionsToProcessView.tsx` — tabs shadcn/ui (3 tabs Admin, 2 tabs Manager)
- `ProjectConfirmCard.tsx`, `WeekPlannerValidateCard.tsx`, `CommitteeActionOverdueCard.tsx`
- `app/actions-to-process/page.tsx` — Server Component avec guard de rôle

### Feature 29 — Actions à traiter — Logique
- `app/actions-to-process/page.tsx` modifié : 3 requêtes Prisma réelles en `Promise.all`
- Guard `if (role === "MANAGER" && !departmentId) redirect("/dashboard")` ajouté
- Minuit UTC avec `new Date(Date.UTC(...))` pour comparaison fiable avec les dates PostgreSQL
- Scope Manager — Week Planners : `user.team.managerId = userId` (équipe directe)
- Scope Manager — Actions comité : `responsible.departmentId = departmentId` (département entier)

### Feature 30 — Tableau de bord — UI complète
- `components/dashboard/types.ts` — `KpiCard`, `BarChartItem`, `PieChartItem`, `ActivityItem`, `AdminProjectRow`, `ManagerTeamRow`, `CollaboratorKeyResultRow`, `DashboardData`
- `lib/mock/dashboard.ts` — 3 exports mock typés (`MOCK_ADMIN_DASHBOARD`, `MOCK_MANAGER_DASHBOARD`, `MOCK_COLLABORATOR_DASHBOARD`)
- `components/dashboard/StatsBar.tsx` — 4 KPI cards avec dot coloré + valeur 30px
- `components/dashboard/DashboardCharts.tsx` — bar chart horizontal (avancement projets) + pie chart donut (statuts tâches), recharts "use client"
- `components/dashboard/RecentActivity.tsx` — feed 5 événements avec icône par type et timestamp relatif
- `components/dashboard/DashboardTable.tsx` — 3 tables contextuelles (Admin=projets à confirmer, Manager=état équipe, Collaborateur=résultats clés)
- `components/dashboard/DashboardView.tsx` — orchestrateur "use client", filtre période (`useState`)
- `app/dashboard/page.tsx` — remplace placeholder, sélection mock par rôle

### Corrections appliquées cette session (review Feature 29)
- `font-600` invalide en Tailwind v4 → `font-semibold` dans les 3 cards
- Garde de rôle non exhaustive (`if (role === "COLLABORATOR")`) → `if (role !== "ADMIN" && role !== "MANAGER")`
- Orphan S3 dans `uploadCertificate` → inner try/catch avec `deleteAttachments([s3Key])` compensatoire
- Bypass `.trim()` dans `updateObjectiveSchema` → `.trim().min(1)` sur le champ `name`
- `updateMyCommitteeActionStatus` utilisait un check inline au lieu de `requireRole()` → canonique
- Double appel `auth()` dans `actions/objectives.ts` → `requireRole()` retourne maintenant `session.user`

## Décisions prises

- **`requireRole()` retourne `session.user`** (backward-compatible — les appelants qui ignorent le retour compilent toujours)
- **3 requêtes indépendantes en `Promise.all`** dans `app/actions-to-process/page.tsx` — pattern à reproduire dans Feature 31
- **Minuit UTC `new Date(Date.UTC(...))`** pour toute comparaison de dates avec PostgreSQL — `setHours(0,0,0,0)` banni (timezone local ≠ UTC)
- **Guard `departmentId`** avant toute requête Prisma filtrée par département (Prisma ignore silencieusement les `undefined` dans un `where`)
- **Dashboard layout** : `app/dashboard/layout.tsx` gère déjà `AppShell pageTitle="Tableau de bord"` — la page ne wrap pas AppShell elle-même
- **Dashboard structure** : PeriodFilter → StatsBar (4 KPIs) → DashboardCharts (bar + pie) → RecentActivity → DashboardTable — même layout pour les 3 rôles, données différentes
- **Tables contextuelles** : Admin = projets non confirmés, Manager = état équipe semaine en cours, Collaborateur = résultats clés en cours
- **Filtre de période en Feature 30** : contrôle uniquement l'état UI (`useState`) — pas de changement de données mock — Feature 31 branchera les vraies requêtes avec la plage de dates

## Problèmes résolus

- **Timezone bug `dueDate: { lt: today }`** — `setHours(0,0,0,0)` donne minuit local, pas UTC. Sur serveur UTC+2, le filtre exclut les actions overdue qui devraient apparaître. Fixé avec `new Date(Date.UTC(...getUTC*...))`.
- **`departmentId: undefined` dans Prisma `where`** — Prisma supprime silencieusement le filtre → Manager voit toutes les actions de l'organisation. Fixé par guard `redirect` avant la query.
- **`font-600` Tailwind v4** — pas de classe utilitaire numérique pour font-weight. Silencieux, produit aucun CSS. Toujours utiliser `font-semibold`, `font-bold`, etc.
- **Zod v4 + react-hook-form** → `zodResolver(schema) as unknown as Resolver<Output>` (cast structurel, déjà connu)

## État actuel

- **Branch :** `dev`
- **Features complètes :** 1–30 (sur 32 au total)
- **TypeScript :** 0 erreur
- **Feature 31 — Tableau de bord — Logique** : terrain vierge — `lib/mock/dashboard.ts` prêt à être remplacé par de vraies requêtes Prisma dans `lib/dashboard-queries.ts` (fichier prévu dans l'architecture, pas encore créé)
- **`context/progress-tracker.md`** : Feature 30 marquée complète, Feature 31 comme prochaine

## La prochaine session commencera par

Lancer **`/architect feature 31`** — Tableau de bord — Logique :
- Remplacer les 3 imports mock par de vraies requêtes Prisma dans `app/dashboard/page.tsx`
- Créer (ou remplir) `lib/dashboard-queries.ts` avec les fonctions de consolidation par rôle
- Brancher le filtre de période sur les plages de dates réelles
- KPIs calculés depuis : `WeekPlannerTask` (taux exécution), `Project` (avancement moyen), `CommitteeAction` (taux réalisation), `actions-to-process` count (actions à traiter)
- Tables brancher : `Project.isConfirmed = false` (Admin), `WeekPlanner` équipe semaine en cours (Manager), `KeyResult` en cours (Collaborateur)

## Questions en suspens

- **Performance Feature 31** : la build plan mentionne "≤ 3 secondes à 100 utilisateurs simultanés" — les requêtes de consolidation doivent être parallélisées (`Promise.all`) et les agrégations faites en Prisma (`_count`, `_avg`) plutôt qu'en mémoire
- **`RecentActivity` Feature 31** : pas de table `Activity` dans le schéma Prisma. Options : (a) agréger depuis plusieurs tables existantes avec `orderBy createdAt desc`, (b) laisser en mock jusqu'à une décision produit. À trancher au moment de l'architecture
- **Filtre période** : la semaine courante est définie par `Date.UTC(...)` — s'assurer que les bornes `weekStart` / `weekEnd` sont cohérentes avec `WeekPlanner.weekStartDate` (lundi) et `weekEndDate` (vendredi)
