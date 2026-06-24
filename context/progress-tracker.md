# Progress Tracker — FACAM PERFORMER

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** TERMINÉ — Toutes les features (1–32) sont implémentées.
**Last completed:** Feature 32 — Guide utilisateur & Remontée de bugs — UI & Logique (2026-06-23) — `app/help/page.tsx`, `components/help/HelpView.tsx` ("use client", assemblage FAQ + formulaire), `components/help/FaqSection.tsx` (accordéon `<details>/<summary>`, contenu statique par rôle Admin/Manager/Collaborateur/Intern), `components/help/BugReportForm.tsx` (react-hook-form + Zod), `actions/bugReports.ts` (submitBugReport — DB insert + email Resend), `lib/schemas/bugReport.ts`, `lib/email.ts` (template bug-report), `.env.example` (SUPPORT_EMAIL)
**Next:** Aucune feature restante — projet complet.

---

## Progress

### Phase 1 — Fondations

- [x] 01 Page d'accueil & Connexion — UI (`app/login`, `components/auth/LoginForm.tsx`, `components/layout/Sidebar.tsx`, `TopBar.tsx`)
- [x] 02 Authentification (email + mot de passe, réinitialisation par OTP) — Logique (`lib/auth.ts`, `actions/auth.ts`, `middleware.ts`, `/api/auth/[...nextauth]`)
- [x] 03 Service d'emails transactionnels (Resend) — Logique (`lib/email.ts`, 5 templates, 3 routes cron, `vercel.json`)
- [x] 04 Schéma de base de données — PostgreSQL (`prisma/schema.prisma` — 23 tables, enums, index — migration exécutée 2026-06-17)
- [x] 05 Stockage S3 & Permissions de base — Logique (`lib/s3-client.ts`, `lib/permissions.ts`)
- [x] 06 Préférences de Notifications & Infrastructure Push — UI & Logique (`public/sw.js`, `lib/push-client.ts`, `lib/web-push.ts`, `lib/notify.ts`, `/api/push/*`, `NotificationPermissionPrompt.tsx`)

### Phase 2 — Organigramme

- [x] 07 Organigramme — UI complète (`app/org-chart/`, `components/org-chart/OrgTree.tsx`, `DepartmentFormModal.tsx`, `SubDepartmentFormModal.tsx`, `TeamFormModal.tsx`)
- [x] 08 Organigramme — Logique (`actions/org-chart.ts`, `lib/schemas/org-chart.ts` — CRUD dept/subdept/team, suppression bloquée si utilisateurs attachés)

### Phase 3 — Administration

- [x] 09 Administration — UI complète (`app/admin/`, `components/admin/UserList.tsx`, `UserListFilters.tsx`, `UserForm.tsx`, `PermissionsMatrix.tsx`)
- [x] 10 Administration — Logique (`actions/admin.ts`, `lib/schemas/admin.ts` — createUser, updateUser, deactivateUser, sendUserCredentials)

### Phase 4 — Projets, Planification (Gantt) & Comités

- [x] 11 Module Projets & Gantt — UI complète (`app/projects/`, `components/projects/`, mock data + Gantt view)
- [x] 12 Création de projet & planning Gantt — Logique (`actions/projects.ts`, `actions/ganttTasks.ts`, `lib/gantt-import.ts`, `components/projects/MilestoneFormModal.tsx` — code PRJ-{année}-{seq}, import Excel, jalons depuis vue détail)
- [x] 13 Confirmation des projets — Logique (`actions/projectValidation.ts` — confirmProject + addConfirmationNote, `components/projects/ProjectConfirmationPanel.tsx`, liste projets câblée DB avec filtrage par rôle Admin/Manager)
- [x] 14 Comités — UI complète (`app/committees/`, `components/committees/` — 3 comités mock, liste cards + détail sections verticales + réunions expandables + actions + modales)
- [x] 15 Comités — Logique (`actions/committees.ts`, `lib/schemas/committee.ts` — createCommittee nested Prisma, planMeeting, createCommitteeAction, updateCommitteeActionStatus, pages câblées DB, toggle statut dans CommitteeActionsList)
- [x] 16 Vue Collaborateur — Mes Projets & Mise à jour de mes tâches (`app/projects/page.tsx` branche COLLABORATOR, `components/projects/CollaboratorProjectsView.tsx`, `MyProjectCard.tsx`, `MyAssignedTasksList.tsx`, `updateMyTaskProgress` dans `actions/projects.ts`)
- [x] 17 Vue Collaborateur — Mes Comités (`app/committees/page.tsx` branche COLLABORATOR, `components/committees/CollaboratorCommitteesView.tsx`, `MyCommitteeCard.tsx`, `MyCommitteeActionsList.tsx`, `updateMyCommitteeActionStatus` dans `actions/committees.ts`)
- [x] 18 Rappels de Réunion — Email ou Notification Push (`app/api/cron/meeting-reminder/route.ts` — cron complet, notifyUser push/email, reminderSentAt anti-doublon)

### Phase 5 — Week Planner

- [x] 19 Week Planner — UI complète (`app/week-planner/page.tsx`, `components/week-planner/` — grille 5 jours, exécution quotidienne, vue Manager, mock data)
- [x] 19b Week Planner Manager + Validation Admin — UI (2026-06-22) — `ManagerWeekPlannerFullView` (onglets Mon Planning / Mon Équipe), `AdminWeekPlannerView` (liste Managers à valider), `validatorLabel` sur `WeekStatusBanner`, Week Planner ajouté dans `ADMIN_NAV`
- [x] 20 Planification hebdomadaire — Logique (2026-06-22) — Server Actions CRUD + DB réelle, EmptyWeekView, navigation URL param, clé React
- [x] 21 Validation du Week Planner — Logique (2026-06-22) — validateWeekPlanner + transaction Règle 8, cron weekly-planner-reminder
- [x] 22 Exécution quotidienne & déclaration du temps — Logique (2026-06-22) — updateTaskExecution, upsert TimeEntry, Gantt Option A, DayTaskPanel branché

### Phase 6 — Suivi ETP & Temps de travail

- [x] 23 Suivi ETP & Temps — UI complète (2026-06-22) — EtpPageView (filtre + KPIs + barres charge), EtpConsolidationTable (3 onglets), EtpExportButtons, page Admin-only
- [x] 24 Suivi ETP & Temps — Logique (2026-06-22) — getEtpData Prisma, rowsToCsv, PDF @react-pdf, routes export, filtre période par URL searchParam

### Phase 7 — Objectifs

- [x] 25 Objectifs individuels — UI complète (2026-06-23) — drawer latéral, ObjectiveFormModal, AddKeyResultModal, KeyResultUpdateModal, ObjectiveDrawer, CollaboratorObjectivesView, ManagerObjectivesView, page avec branching par rôle
- [x] 26 Objectifs individuels — Logique (2026-06-23) — 7 Server Actions (createObjective, updateObjective, deleteObjective, addKeyResult, updateKeyResultProgress, deleteKeyResult, uploadCertificate), S3 via deleteAttachments(), page câblée DB, types nettoyés (mock supprimé)
- [x] 27 Objectifs Départements — UI & Logique (2026-06-23) — vue agrégée par département, agrégation KRs on-the-fly, ADMIN = tous départements, MANAGER = son département, readonly

### Phase 8 — Actions à traiter

- [x] 28 Actions à traiter — UI complète (2026-06-23)
- [x] 29 Actions à traiter — Logique (2026-06-23)

### Phase 9 — Tableau de bord

- [x] 30 Tableau de bord — UI complète (2026-06-23)
- [x] 31 Tableau de bord — Logique (2026-06-23)

### Phase 10 — Accueil / Guide / Support

- [x] 32 Guide utilisateur & Remontée de bugs — UI & Logique (2026-06-23)

---

## Decisions Made During Build

- **Une seule entité gérée — FACAM STAIRWAY** (Règle 1) — aucune logique multi-tenant à prévoir nulle part dans le schéma ou les requêtes.
- **Prisma** retenu comme client PostgreSQL, **Auth.js (NextAuth v5) en Credentials** pour l'authentification email + mot de passe, session JWT.
- **Pas de suivi analytics** (PostHog ou équivalent) sur ce projet — décision explicite.
- **gantt-task-react** retenu pour le rendu de la vue Gantt. **xlsx + Zod** pour l'import du planning, rejet en bloc si une seule ligne est invalide.
- **Fiche projet en 5 modules** (Identité, Gouvernance, Cadrage Temporel & Jalons, Financier, Spécifications & Livrables), avec génération automatique du `code` (`PRJ-{année}-{séquence}`).
- **État de confirmation projet simplifié en booléen** `isConfirmed` (confirmé par l'Administrateur principal, ou pas encore) plutôt qu'un statut Brouillon/Soumis/Validé/Rejeté — `currentStatus` (cycle de vie opérationnel) reste un champ indépendant. Un `confirmationNote` optionnel permet à l'Administrateur de laisser un commentaire sans bloquer le projet sur un état terminal de rejet.
- **Comités restructurés en 5 tables** : `Committee` (nom, responsable, objectifs, fréquence), `CommitteeDepartment` (départements inclus), `CommitteeMember` (Participants et Invités distingués par `memberType`), `CommitteeMeeting` (date, début, fin, lien de connexion — un comité peut avoir plusieurs réunions dans le temps), `CommitteeAction` (toujours liée à une réunion précise, jamais directement au comité).
- **Extension de la matrice Modules × Rôles d'origine** : le Collaborateur a désormais un accès en lecture aux Comités dont il est membre, et peut mettre à jour l'avancement (`progressPercent` uniquement) de ses propres tâches Gantt assignées — décision explicite du client, au-delà du périmètre initial du cahier des charges.
- **Notifications push de bureau (façon WhatsApp Web)** ajoutées comme canal alternatif à l'email, sur consentement explicite uniquement. `lib/notify.ts` (`notifyUser()`) est le point d'entrée unique : push si `notificationConsent = ACCEPTED` et abonnement actif, sinon email — jamais les deux pour le même événement. Le navigateur ne demande la permission qu'après un clic explicite sur le bandeau in-app, jamais la popup native déclenchée sans contexte.
- **Premier cas d'usage du canal push** : rappel de réunion de comité, envoyé par un cron horaire (`/api/cron/meeting-reminder`) aux Participants et Invités d'une réunion à venir dans les 24h. `CommitteeMeeting.reminderSentAt` empêche les doublons même en cas d'échec partiel d'envoi.
- **Verrouillage de semaine (Règle 8)** implémenté via `prisma.$transaction` — la validation du Week Planner et le verrouillage des tâches associées doivent réussir ou échouer ensemble.
- **Visibilité conditionnelle des tâches du jour (Règle 9)** — les tâches n'apparaissent dans l'exécution quotidienne qu'après validation du Week Planner de la semaine par le Manager, jamais avant.
- **Export Suivi ETP** en PDF via `@react-pdf/renderer` et en CSV via génération native — réservés au rôle Administrateur.
- **Objectifs restructurés en Objectif + Résultats clés (KeyResult)** : un `Objective` a un `type` (PERFORMANCE / SKILLS_DEVELOPMENT), une liste de `risks` saisie à la création, et un ou plusieurs `KeyResult` mesurables (description, valeur cible, valeur atteinte, preuve textuelle, date limite, statut). Le statut de chaque résultat clé est mis à jour par le Collaborateur propriétaire pour montrer l'avancement réel. La preuve de type certificat (objectifs de compétences) passe par la table `Attachment` existante (`relatedType = KEY_RESULT`), jamais un champ de fichier dédié dupliqué.
- **Réinitialisation de mot de passe par OTP** (code à 6 chiffres, expiration 10 minutes, usage unique) remplace le lien envoyé par email — `PasswordResetToken` renommé `PasswordResetOtp`. Toute nouvelle demande invalide les codes précédents non utilisés du même utilisateur.
- **Création d'utilisateur par l'Admin** : bouton "Générer un mot de passe aléatoire" (côté navigateur, `crypto.getRandomValues`) et bouton "Envoyer les identifiants" sur le même formulaire — ce dernier hash et persiste le mot de passe courant puis envoie le template "credentials" par email, garantissant que l'email envoyé correspond toujours au mot de passe réellement stocké. Le mot de passe en clair ne transite jamais ailleurs que dans cette requête.
- **Templates "otp-reset" et "credentials"** fournis par le client, toujours envoyés via Resend (email) — jamais via le canal push, quel que soit le consentement notification de l'utilisateur concerné (ce sont des messages de sécurité).

---

## Notes

- **Prisma 7.8.0** (breaking changes multiples) :
  - Client généré dans `app/generated/prisma/` — importer depuis `@/app/generated/prisma/client` (pas l'index du dossier, pas `@prisma/client`)
  - `provider = "prisma-client"` requiert un adapter : `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })` — package `@prisma/adapter-pg`
  - La config datasource URL est dans `prisma.config.ts` (import `dotenv/config`)
- **shadcn/ui init** non interactif : créer `components.json` manuellement puis `npx shadcn@latest add <composants> --yes --overwrite`.
- **Next.js 16 breaking change** : `middleware.ts` renommé en `proxy.ts` (même logique, même export default). Docs : `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.
- **next-auth v5 proxy** : utiliser `auth((req) => { ... })` comme default export dans `proxy.ts`. `req.auth` pour la session.
- **Mapping shadcn → tokens FACAM** : variables CSS `--color-primary`, `--color-ring`, etc. ajoutées dans `@theme` de `globals.css` pour que les composants shadcn utilisent les couleurs FACAM.
- **Tailwind v4 scanning** : ajouter `@source not "../node_modules"` et `@source not "../context"` dans `globals.css` pour éviter que Tailwind génère du CSS invalide depuis des placeholders dans les fichiers markdown de la documentation.
- **Zod v4 + react-hook-form** : `zodResolver(schema)` de `@hookform/resolvers/zod` v5 retourne `Resolver<Input, ctx, Output>` où `Input` est le type avant coercion. Incompatible avec `useForm<Output>` qui s'attend à un `Resolver<Output>`. Fix : `zodResolver(schema) as unknown as Resolver<Output>` — les types runtime sont corrects, c'est un cast de type purement structurel. `xlsx` n'était pas installé malgré sa présence dans les deps approuvées → `npm install xlsx --legacy-peer-deps`.
- **turbopack.root** : définir `turbopack: { root: path.resolve(__dirname) }` dans `next.config.ts` pour éviter la détection erronée du workspace root (problème si plusieurs `package-lock.json` dans l'arborescence).
- **Sidebar** : Server Component pour le filtrage par rôle. `SidebarNav.tsx` est le seul Client Component, utilise `usePathname()` pour l'item actif.
