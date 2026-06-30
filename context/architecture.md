# Architecture — FACAM PERFORMER

## Stack

| Couche | Outil | Rôle |
| --- | --- | --- |
| Framework | Next.js (App Router) | Framework full stack |
| Base de données | PostgreSQL + Prisma | Persistance relationnelle, ORM, migrations |
| Authentification | Auth.js (NextAuth v5) — Credentials | Email + mot de passe, sessions JWT |
| Hashage mot de passe | bcrypt | Stockage sécurisé des mots de passe |
| Stockage fichiers | AWS S3 (SDK v3) | Justificatifs, livrables, archives d'import Gantt |
| Emails transactionnels | Resend | Réinitialisation MDP, rappels quotidiens/hebdomadaires |
| Tâches planifiées | Vercel Cron | Déclenchement des rappels automatiques |
| Notifications Push | web-push (VAPID) + Service Worker natif | Notifications desktop façon WhatsApp Web, alternative à l'email sur consentement |
| Vue Gantt | gantt-task-react | Rendu interactif de la planification de projet |
| Import planning | xlsx + Zod | Lecture et validation du template Excel Gantt |
| Génération PDF | @react-pdf/renderer | Export du rapport Suivi ETP |
| Graphiques | recharts | Tableau de bord (KPIs, distribution, tendances) |
| Formulaires | react-hook-form + Zod | Validation client et serveur partagée |
| Dates | date-fns (locale fr) | Bornes de semaine, formatage |
| Style | Tailwind CSS v4 + shadcn/ui | UI et composants |
| Langage | TypeScript strict | Sur tout le projet |

Pas d'agent IA, pas de service d'analytics (PostHog ou équivalent) sur ce projet — décisions explicites, contrairement au projet de référence utilisé comme modèle.

---

## Folder Structure

```
/
├── AGENTS.md
├── context/
│   ├── project-overview.md
│   ├── architecture.md
│   ├── ui-tokens.md
│   ├── ui-rules.md
│   ├── ui-registry.md
│   ├── code-standards.md
│   ├── library-docs.md
│   ├── build-plan.md
│   └── progress-tracker.md
├── prisma/
│   └── schema.prisma                        → Schéma de base de données complet
├── public/
│   └── sw.js                                → Service Worker — réception et affichage des notifications push
├── app/
│   ├── layout.tsx                            → Root layout, police Montserrat
│   ├── page.tsx                              → Page d'accueil (login si non authentifié)
│   ├── login/
│   │   └── page.tsx                          → Page de connexion
│   ├── reset-password/
│   │   └── page.tsx                          → Réinitialisation de mot de passe
│   ├── dashboard/
│   │   └── page.tsx                          → Tableau de bord (vue selon rôle)
│   ├── org-chart/
│   │   └── page.tsx                          → Organigramme
│   ├── admin/
│   │   ├── users/page.tsx                    → Gestion des utilisateurs
│   │   └── permissions/page.tsx              → Configuration des permissions
│   ├── projects/
│   │   ├── page.tsx                          → Liste des projets
│   │   └── [id]/page.tsx                     → Détail projet + vue Gantt
│   ├── committees/
│   │   └── page.tsx                          → Comités et actions décidées
│   ├── week-planner/
│   │   └── page.tsx                          → Planification + exécution quotidienne
│   ├── etp-tracking/
│   │   └── page.tsx                          → Suivi ETP & Temps (Administrateur)
│   ├── objectives/
│   │   └── page.tsx                          → Objectifs individuels
│   ├── department-objectives/
│   │   └── page.tsx                          → Objectifs Départements
│   ├── actions-to-process/
│   │   └── page.tsx                          → Actions à traiter
│   ├── help/
│   │   └── page.tsx                          → Guide / FAQ / Remontée de bugs
│   └── api/
│       ├── auth/[...nextauth]/route.ts       → Handlers Auth.js
│       ├── cron/
│       │   ├── daily-reminder/route.ts       → Rappel quotidien (jours ouvrés)
│       │   ├── weekly-reminder/route.ts      → Rappel hebdomadaire (vendredi 15h)
│       │   └── meeting-reminder/route.ts     → Rappel de réunion de comité (push ou email)
│       ├── push/
│       │   ├── subscribe/route.ts            → Sauvegarde de l'abonnement push
│       │   └── unsubscribe/route.ts          → Suppression de l'abonnement push
│       └── reports/
│           └── etp/
│               ├── route.ts                  → Export PDF Suivi ETP
│               └── csv/route.ts              → Export CSV Suivi ETP
├── actions/
│   ├── auth.ts                               → Demande de réinitialisation par OTP + vérification du code
│   ├── orgChart.ts                           → CRUD départements/sous-départements/équipes
│   ├── users.ts                              → CRUD utilisateurs (Admin) + envoi des identifiants par email
│   ├── projects.ts                           → Création projet, ajout membres
│   ├── ganttTasks.ts                         → CRUD tâches Gantt + import Excel + mise à jour d'avancement par le Collaborateur assigné
│   ├── projectValidation.ts                  → Confirmation de projet par l'Administrateur principal
│   ├── committees.ts                         → Création comité (+ départements/participants/invités), planification réunions, actions décidées
│   ├── weekPlanner.ts                        → Création/édition planning de semaine
│   ├── weekPlannerValidation.ts              → Validation de semaine (Manager)
│   ├── dailyExecution.ts                     → Mise à jour statut tâche + déclaration temps
│   ├── objectives.ts                         → CRUD objectifs individuels + résultats clés (création, mise à jour de statut/valeur)
│   ├── departmentObjectives.ts               → Consolidation objectifs départements
│   ├── notifications.ts                      → Mise à jour du consentement, gestion abonnement push
│   └── bugReports.ts                         → Soumission formulaire de bug
├── components/
│   ├── ui/                                   → Composants shadcn/ui uniquement
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   ├── auth/
│   │   └── LoginForm.tsx
│   ├── org-chart/
│   │   ├── OrgChartTree.tsx
│   │   └── NodeDetailCard.tsx
│   ├── administration/
│   │   ├── UserTable.tsx
│   │   ├── UserForm.tsx
│   │   └── PermissionsMatrix.tsx
│   ├── projects/
│   │   ├── ProjectList.tsx
│   │   ├── ProjectForm.tsx
│   │   ├── ProjectMilestonesList.tsx
│   │   ├── ProjectGanttView.tsx
│   │   ├── GanttImportZone.tsx
│   │   └── MyAssignedTasksList.tsx           → Vue Collaborateur — tâches qui lui sont assignées
│   ├── committees/
│   │   ├── CommitteeForm.tsx
│   │   ├── CommitteeMeetingForm.tsx
│   │   ├── CommitteeCalendar.tsx
│   │   ├── CommitteeActionsList.tsx
│   │   └── MyCommitteesList.tsx              → Vue Collaborateur — comités dont il est membre
│   ├── notifications/
│   │   └── NotificationPermissionPrompt.tsx  → Bandeau de consentement aux notifications push
│   ├── week-planner/
│   │   ├── WeekPlannerGrid.tsx
│   │   ├── DailyExecutionView.tsx
│   │   └── TaskStatusBadge.tsx
│   ├── etp/
│   │   ├── EtpConsolidationTable.tsx
│   │   └── EtpExportButtons.tsx
│   ├── objectives/
│   │   ├── ObjectiveForm.tsx
│   │   ├── KeyResultsList.tsx
│   │   ├── KeyResultUpdateModal.tsx
│   │   └── ObjectiveProgressCard.tsx
│   ├── actions-to-process/
│   │   └── PendingActionsList.tsx
│   ├── dashboard/
│   │   ├── StatsBar.tsx
│   │   ├── RecentActivity.tsx
│   │   └── DashboardCharts.tsx
│   └── help/
│       ├── FaqPage.tsx
│       └── BugReportForm.tsx
├── lib/
│   ├── prisma.ts                             → Client Prisma singleton
│   ├── auth.ts                               → Configuration Auth.js
│   ├── password.ts                           → hashPassword / verifyPassword (bcrypt)
│   ├── generate-password.ts                  → Génération d'un mot de passe aléatoire sécurisé (Admin)
│   ├── permissions.ts                        → requireRole() — RBAC centralisé
│   ├── constants.ts                          → Constantes métier (statuts, seuils, cron)
│   ├── s3-client.ts                          → Client AWS S3
│   ├── email.ts                              → Client Resend + envoi de templates
│   ├── push-client.ts                        → Enregistrement Service Worker + abonnement Push API (navigateur)
│   ├── web-push.ts                           → Client web-push (VAPID) — envoi serveur
│   ├── notify.ts                             → notifyUser() — routage push ou email selon consentement
│   ├── gantt-import.ts                       → Parsing + validation du template Excel
│   ├── dashboard-queries.ts                  → Requêtes Prisma de consolidation (KPIs)
│   ├── reports/
│   │   ├── etp-report.tsx                    → Génération PDF Suivi ETP
│   │   └── csv-export.ts                     → Génération CSV générique
│   └── schemas/                              → Schémas Zod partagés par formulaire
│       ├── weekPlanner.ts
│       ├── project.ts
│       ├── objective.ts
│       └── user.ts
└── types/
    └── index.ts                              → Types TypeScript partagés (hors types générés Prisma)
```

---

## System Boundaries

| Dossier | Possède |
| --- | --- |
| `app/` | Pages et Route Handlers uniquement. Aucune logique métier. |
| `actions/` | Server Actions pour toute mutation déclenchée par l'UI. Toujours protégées par `requireRole()`. |
| `components/` | UI uniquement. Aucune requête Prisma directe, aucun fetch de données. |
| `lib/` | Initialisation de clients tiers, utilitaires partagés, RBAC, constantes. |
| `prisma/` | Source unique de vérité du schéma de données. |
| `types/` | Types TypeScript partagés non générés par Prisma. |

---

## Data Flow

### Mutations UI (Server Actions)

```
Interaction utilisateur dans un composant
        ↓
Server Action dans actions/
        ↓
requireRole() vérifie la permission
        ↓
Écriture Prisma (transaction si multi-tables)
        ↓
revalidatePath()
```

### Création & Confirmation de Projet (Règle 10)

```
Manager crée le projet (code généré automatiquement PRJ-{année}-{séquence})
+ équipe projet + jalons + planning Gantt
(actions/projects.ts, actions/ganttTasks.ts)
        ↓
Project.isConfirmed = false par défaut
        ↓
Administrateur principal consulte et confirme — ou laisse une confirmationNote
(actions/projectValidation.ts)
        ↓
Si isConfirmed = true → projet disponible comme option de rattachement dans le Week Planner
```

Pas d'état "Rejeté" distinct : un projet non confirmé reste modifiable par le Manager et peut être resoumis à la confirmation autant de fois que nécessaire. `currentStatus` (cycle de vie opérationnel : Initié, En cours, En pause, Livré, Annulé…) reste indépendant de `isConfirmed` (porte d'accès au Week Planner).

### Verrouillage de Semaine (Week Planner, Règles 8 et 9)

```
Collaborateur planifie sa semaine (actions/weekPlanner.ts) — statut DRAFT puis SUBMITTED
        ↓
Manager valide (actions/weekPlannerValidation.ts) — transaction Prisma
        ↓
Statut WeekPlanner → VALIDATED, toutes les WeekPlannerTask → isLocked = true
        ↓
Tâches du jour visibles dans l'exécution quotidienne (jamais avant)
        ↓
Toute correction nécessite une nouvelle planification — jamais d'édition de la semaine validée
```

### Rappels Automatiques (Vercel Cron)

```
vercel.json déclenche /api/cron/daily-reminder (jours ouvrés, 8h)
et /api/cron/weekly-reminder (vendredi 15h)
        ↓
Vérification du header Authorization contre CRON_SECRET
        ↓
Requête Prisma sur les utilisateurs actifs concernés
        ↓
Envoi via lib/email.ts (Resend) — chaque envoi isolé dans son propre try/catch
```

### Export de Rapports (Route Handlers, Administrateur uniquement)

```
Clic sur "Exporter" dans EtpExportButtons.tsx
        ↓
GET /api/reports/etp ou /api/reports/etp/csv
        ↓
requireRole(["ADMIN"])
        ↓
lib/dashboard-queries.ts agrège les données
        ↓
@react-pdf/renderer (PDF) ou rowsToCsv (CSV) génère le buffer
        ↓
Réponse HTTP en téléchargement direct — jamais persisté
```

### Création d'Utilisateur & Envoi des Identifiants (Administrateur)

```
Administrateur remplit le formulaire (UserForm.tsx) — email + mot de passe
        ↓
Clic sur "Générer un mot de passe aléatoire" → lib/generate-password.ts remplit le champ (client)
        ↓
Clic sur "Envoyer les identifiants" → actions/users.ts → sendUserCredentials()
        ↓
Hash du mot de passe courant du formulaire (bcrypt) → upsert User.passwordHash
        ↓
lib/email.ts envoie le template "credentials" (email + mot de passe en clair) — jamais stocké en clair après l'envoi
```

### Réinitialisation de Mot de Passe par OTP

```
Utilisateur demande la réinitialisation (email) sur /login
        ↓
actions/auth.ts → requestPasswordReset()
        ↓
Invalide les PasswordResetOtp non utilisés existants pour cet utilisateur
        ↓
Génère un code à 6 chiffres, PasswordResetOtp créé (expiresAt = +10 min)
        ↓
Envoi du template "otp-reset" par email (Resend)
        ↓
Utilisateur saisit le code + nouveau mot de passe sur /reset-password
        ↓
Vérifie code valide, non expiré, non utilisé → met à jour passwordHash, usedAt = now()
```

### Import de Planning Gantt (Server Action)

```
Manager dépose un fichier Excel (template fixe) dans GanttImportZone.tsx
        ↓
actions/ganttTasks.ts reçoit le buffer
        ↓
lib/gantt-import.ts parse + valide chaque ligne avec Zod
        ↓
Si une seule ligne invalide → rejet en bloc, aucun insert partiel
        ↓
Insertion des GanttTask en transaction Prisma, archive du fichier sur S3
```

### Consentement & Abonnement aux Notifications Push

```
Connexion de l'utilisateur, User.notificationConsent = NOT_ASKED
        ↓
NotificationPermissionPrompt.tsx affiché (bandeau, jamais la popup navigateur sans contexte)
        ↓
Utilisateur clique "Activer les notifications"
        ↓
lib/push-client.ts enregistre le Service Worker + Notification.requestPermission()
        ↓
Si accordée → abonnement PushManager → POST /api/push/subscribe
        ↓
PushSubscription créée, User.notificationConsent = ACCEPTED
        ↓
Si refusée (navigateur ou bandeau "Plus tard") → User.notificationConsent = DECLINED
```

### Rappel de Réunion de Comité (Vercel Cron)

```
/api/cron/meeting-reminder déclenché (ex. toutes les heures)
        ↓
Requête Prisma : CommitteeMeeting dans les 24h, reminderSentAt IS NULL
        ↓
Pour chaque réunion → récupère les CommitteeMember (Participants + Invités)
        ↓
Pour chaque membre → lib/notify.ts décide : ACCEPTED + abonnement actif → web-push,
                      sinon → email (Resend), jamais les deux
        ↓
CommitteeMeeting.reminderSentAt = now() — empêche les doublons même si un envoi individuel échoue
```

### Mise à jour d'une Tâche Assignée (Vue Collaborateur)

```
Collaborateur ouvre MyAssignedTasksList.tsx (dans sa vue "Mes Projets")
        ↓
Liste des GanttTask où responsibleUserId = lui-même, tous projets confirmés confondus
        ↓
Sélectionne une tâche → met à jour uniquement le statut/avancement
        ↓
actions/ganttTasks.ts → updateMyTaskProgress()
        ↓
Vérifie responsibleUserId === session.user.id (sinon refus) — jamais d'édition des dates ou dépendances
```

---

## Database Schema (Prisma)

### `User`

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| fullName | string | |
| email | string | Unique |
| passwordHash | string | bcrypt, coût 12 |
| role | enum | ADMIN / MANAGER / COLLABORATOR — un seul rôle actif (Règle 2) |
| departmentId | uuid | FK Department — obligatoire (Règle 3) |
| teamId | uuid? | FK Team — optionnel |
| isActive | boolean | Désactivation plutôt que suppression |
| notificationConsent | enum | NOT_ASKED / ACCEPTED / DECLINED — défaut NOT_ASKED |
| notificationConsentAt | timestamp? | |
| createdAt / updatedAt | timestamp | |

### `PasswordResetOtp`

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| userId | uuid | FK User |
| code | string | Code à 6 chiffres, usage unique |
| expiresAt | timestamp | Expiration 10 minutes |
| usedAt | timestamp? | Null si non utilisé |
| createdAt | timestamp | |

À chaque nouvelle demande de réinitialisation, les `PasswordResetOtp` précédents non utilisés du même utilisateur sont invalidés (supprimés) — un seul code valide à la fois par utilisateur.

### `PushSubscription`

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| userId | uuid | FK User |
| endpoint | string | Unique — URL d'envoi fournie par le navigateur |
| p256dhKey | string | Clé publique de chiffrement (fournie par le navigateur) |
| authKey | string | Secret d'authentification (fourni par le navigateur) |
| createdAt | timestamp | |

Un utilisateur peut avoir plusieurs `PushSubscription` (plusieurs appareils/navigateurs). Une souscription expirée ou invalide est supprimée au premier échec d'envoi — jamais réessayée indéfiniment.

### `Department` / `SubDepartment` / `Team`

| Colonne | Type | Notes |
| --- | --- | --- |
| Department.id, name | | Niveau racine de la hiérarchie |
| SubDepartment.id, name, departmentId | | FK Department |
| Team.id, name, subDepartmentId, managerId | | FK SubDepartment, FK User (manager) — Règle 4 |

### `Project`

**1. Identité & Informations Générales**

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| code | string | Unique, généré automatiquement — format `PRJ-{année}-{séquence sur 3 chiffres}` (ex. PRJ-2026-001) |
| name | string | |
| description | text | Résumé du "pourquoi" et du "quoi" |
| category | enum | RESEARCH_DEVELOPMENT / INFRASTRUCTURE / CLIENT / INTERNAL_TRANSFORMATION / MARKETING / OTHER |
| strategicPriority | enum | LOW / MEDIUM / HIGH / CRITICAL_REGULATORY |
| currentStatus | enum | PENDING / INITIATED / IN_PROGRESS / PAUSED / DELIVERED / CANCELLED — cycle de vie opérationnel |

**2. Gouvernance & Parties Prenantes**

| Colonne | Type | Notes |
| --- | --- | --- |
| sponsorUserId | uuid | FK User — Sponsor / commanditaire |
| projectManagerId | uuid | FK User — Chef de Projet, responsable unique (Règle 5) |
| beneficiaryType | enum | INTERNAL / EXTERNAL |
| beneficiaryDepartmentId | uuid? | FK Department — si bénéficiaire interne |
| beneficiaryExternalName | string? | Si bénéficiaire externe |

*(Équipe projet : voir `ProjectTeamMember` ci-dessous)*

**3. Cadrage Temporel & Jalons**

| Colonne | Type | Notes |
| --- | --- | --- |
| estimatedStartDate | date | |
| actualStartDate | date? | |
| targetEndDate | date | Deadline |
| actualEndDate | date? | |

*(Jalons clés : voir `ProjectMilestone` ci-dessous)*

**4. Gestion Financière & Ressources**

| Colonne | Type | Notes |
| --- | --- | --- |
| initialBudget | decimal | Budget initial alloué |
| consumedBudget | decimal | Mis à jour dynamiquement (dépenses + temps passé via TimeEntry) |
| estimatedHrCostDays | decimal | Charge de travail estimée en jours-homme |
| externalExpensesPlanned | decimal | Prestations, licences, matériel informatique |

**5. Spécifications Techniques & Livrables**

| Colonne | Type | Notes |
| --- | --- | --- |
| scopeIncluded | text | Périmètre inclus |
| scopeExcluded | text | Périmètre explicitement exclu — évite les demandes hors-sujet |
| expectedDeliverables | text[] | Livrables concrets attendus |
| successCriteria | text[] | Critères de succès / KPI |
| documentationLinks | text[] | Liens vers cahier des charges, maquettes, drive partagé |

**État de confirmation (transverse)**

| Colonne | Type | Notes |
| --- | --- | --- |
| isConfirmed | boolean | Confirmé par l'Administrateur principal, ou pas encore — défaut `false` |
| confirmedById | uuid? | FK User — Administrateur ayant confirmé |
| confirmedAt | timestamp? | |
| confirmationNote | text? | Commentaire de l'Administrateur si non confirmé |
| createdAt / updatedAt | timestamp | |

Pas de gestion des risques ni des dépendances inter-projets sur cette fiche — suivi volontairement ultra-opérationnel. Les seules dépendances modélisées restent celles entre tâches Gantt (`GanttTask.dependsOnIds`).

### `ProjectTeamMember`

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| projectId | uuid | FK Project |
| userId | uuid | FK User — un collaborateur peut appartenir à plusieurs projets (Règle 6) |
| roleLabel | string | Rôle dans le projet (ex. Développeur, Expert Métier, Designer) |

### `ProjectMilestone`

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| projectId | uuid | FK Project |
| title | string | Ex. "Fin de phase de spécification", "MVP opérationnel" |
| targetDate | date | |
| achievedDate | date? | Renseigné à l'atteinte réelle du jalon |
| createdAt | timestamp | |

### `GanttTask`

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| projectId | uuid | FK Project |
| title | string | |
| startDate / endDate | date | |
| progressPercent | integer | 0–100 |
| dependsOnIds | string[] | IDs des tâches dépendantes |
| responsibleUserId | uuid | FK User |
| createdAt / updatedAt | timestamp | |

### `Committee`

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| name | string | Nom du comité |
| responsibleUserId | uuid | FK User — Responsable du comité |
| objectives | text | |
| frequency | enum | WEEKLY / MONTHLY / QUARTERLY / ANNUAL / AD_HOC |
| createdAt / updatedAt | timestamp | |

### `CommitteeDepartment`

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| committeeId | uuid | FK Committee |
| departmentId | uuid | FK Department — Départements inclus |

### `CommitteeMember`

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| committeeId | uuid | FK Committee |
| userId | uuid | FK User |
| memberType | enum | PARTICIPANT / GUEST — distingue Participants et Invités |

### `CommitteeMeeting`

Une réunion planifiée pour un comité existant (un comité peut avoir plusieurs réunions au fil du temps, selon sa fréquence).

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| committeeId | uuid | FK Committee |d
| meetingDate | date | Date de la réunion |
| startDateTime | timestamp | Date/heure de début |
| endDateTime | timestamp | Date/heure de fin |
| meetingLink | string? | Lien de connexion (Teams / Zoom / Meet) |
| reminderSentAt | timestamp? | Renseigné après envoi du rappel — empêche les doublons |
| createdAt | timestamp | |

### `CommitteeAction`

Décision prise lors d'une réunion précise.

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| meetingId | uuid | FK CommitteeMeeting |
| title | string | |
| responsibleUserId | uuid | FK User |
| dueDate | date | |
| status | enum | PENDING / DONE — alimente le taux de réalisation des décisions |
| createdAt | timestamp | |

### `WeekPlanner`

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| userId | uuid | FK User |
| weekStartDate / weekEndDate | date | Lundi à vendredi |
| status | enum | DRAFT / SUBMITTED / VALIDATED |
| validatedById | uuid? | FK User (Manager) |
| validatedAt | timestamp? | |
| createdAt | timestamp | |

### `WeekPlannerTask`

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| weekPlannerId | uuid | FK WeekPlanner |
| projectId | uuid? | FK Project — null si tâche hors-projet (Règle 11) |
| title | string | |
| plannedDay | enum | MON / TUE / WED / THU / FRI |
| status | enum | STARTED / IN_PROGRESS / DONE / NOT_DONE |
| comment | text? | Obligatoire si status = NOT_DONE (Règle 12) |
| isLocked | boolean | true après validation de la semaine (Règle 8) |
| createdAt / updatedAt | timestamp | |

### `TimeEntry`

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| userId | uuid | FK User |
| weekPlannerTaskId | uuid? | FK WeekPlannerTask |
| date | date | |
| hoursSpent | decimal | |
| activityLabel | string | |
| createdAt | timestamp | |

### `Objective`

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| userId | uuid | FK User — propriétaire de l'objectif |
| name | string | Nom de l'objectif |
| description | text | |
| type | enum | PERFORMANCE / SKILLS_DEVELOPMENT |
| risks | text[] | Risques associés à l'objectif, énumérés à la création — anticipe les surprises en cours de période |
| frequency | enum | ANNUAL / QUARTERLY / MONTHLY |
| periodStart / periodEnd | date | |
| createdAt / updatedAt | timestamp | |

**PERFORMANCE** : objectifs chiffrables (ex. "Ajouter 3 nouveaux clients", "Vendre 50 produits avant le 31/12"). **SKILLS_DEVELOPMENT** : objectifs de développement des compétences, dont la preuve attendue est un certificat de formation.

### `KeyResult`

Un résultat clé mesurable, rattaché à un objectif. Un objectif peut avoir plusieurs résultats clés (ex. un objectif "Développement commercial" avec deux résultats clés : "3 nouveaux clients" et "50 produits vendus").

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| objectiveId | uuid | FK Objective |
| description | string | Ex. "Ajouter 3 nouveaux clients", "Obtenir la certification AWS SAA" |
| targetValue | decimal? | Valeur chiffrée visée — si applicable (objectifs de performance) |
| currentValue | decimal? | Valeur atteinte, mise à jour par le Collaborateur au fil du temps |
| evidenceNote | text? | Preuve textuelle (ex. noms des clients effectivement ajoutés) |
| dueDate | date? | Date limite du résultat clé |
| status | enum | NOT_STARTED / IN_PROGRESS / DONE — mis à jour par le Collaborateur pour montrer que le travail est fait |
| createdAt / updatedAt | timestamp | |

La preuve de type certificat (objectifs SKILLS_DEVELOPMENT) est stockée via `Attachment` (`relatedType = KEY_RESULT`, `relatedId = KeyResult.id`) — jamais un champ de fichier dédié dupliqué sur `KeyResult`.

### `DepartmentObjective`

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| departmentId | uuid | FK Department |
| title | string | |
| frequency | enum | ANNUAL / QUARTERLY / MONTHLY |
| aggregatedProgressPercent | integer | Calculé à partir du statut des `KeyResult` de tous les `Objective` des utilisateurs du département (% de `KeyResult.status = DONE`) |
| periodStart / periodEnd | date | |

### `Attachment`

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| s3Key | string | Clé S3 — jamais l'URL signée |
| fileName | string | |
| contentType | string | |
| relatedType | enum | PROJECT_TASK / WEEK_PLANNER_TASK / COMMITTEE_ACTION / KEY_RESULT |
| relatedId | uuid | |
| uploadedById | uuid | FK User |
| createdAt | timestamp | |

### `BugReport`

| Colonne | Type | Notes |
| --- | --- | --- |
| id | uuid | |
| userId | uuid | FK User |
| description | text | |
| status | enum | OPEN / RESOLVED |
| createdAt | timestamp | |

---

## Stockage AWS S3

| Bucket | Chemin | Contenu |
| --- | --- | --- |
| facam-performer | `attachments/{projectId}/{taskId}/{fileName}` | Justificatifs et livrables de tâche |
| facam-performer | `gantt-imports/{projectId}/{fileName}` | Archive des fichiers Excel importés |
| facam-performer | `key-results/{keyResultId}/{fileName}` | Certificats de formation (objectifs SKILLS_DEVELOPMENT) |

Accès : bucket privé, jamais d'URL publique permanente — toujours une URL signée à expiration courte (5 min).

---

## Authentification

- Provider : Auth.js (NextAuth v5) — Credentials (email + mot de passe)
- Stratégie de session : JWT (`role` et `departmentId` injectés à la connexion)
- Routes protégées : `/dashboard`, `/org-chart`, `/admin`, `/projects`, `/committees`, `/week-planner`, `/etp-tracking`, `/objectives`, `/department-objectives`, `/actions-to-process`
- Routes publiques : `/`, `/login`, `/reset-password`
- Middleware (`middleware.ts`) vérifie la présence de session sur chaque route protégée — le contrôle fin par rôle se fait dans `lib/permissions.ts` (`requireRole()`), jamais dans le middleware seul
- Pas d'auto-inscription — les comptes sont créés par l'Administrateur (module Administration), qui peut générer un mot de passe aléatoire et envoyer les identifiants par email en un clic depuis le formulaire de création
- Réinitialisation de mot de passe par OTP : code à 6 chiffres envoyé par email (`PasswordResetOtp`), jamais de lien — l'utilisateur saisit le code reçu puis son nouveau mot de passe sur `/reset-password`
- Après connexion → redirection vers `/dashboard`

---

## Pattern Client Prisma

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

Toute requête sensible (week_planner, time_entry, objective) est scopée par rôle : `userId` pour le Collaborateur, hiérarchie d'équipe pour le Manager, non filtrée pour l'Administrateur. Voir library-docs.md pour les patterns complets.

---

## Pattern RBAC

```typescript
// lib/permissions.ts
export async function requireRole(allowed: Role[]) {
  const session = await auth();
  if (!session || !allowed.includes(session.user.role)) {
    throw new Error("Permission refusée");
  }
  return session;
}
```

Appelé en première ligne de toute Server Action ou Route Handler touchant à une donnée sensible. La matrice Modules × Rôles du cahier des charges est la seule source de vérité pour les permissions.

---

## Invariants

Règles que l'agent IA ne doit jamais violer :

- Les pages (`app/`) ne contiennent aucune logique métier — uniquement composition de Server Components et appel de Server Actions.
- Toute mutation passe par `actions/` (Server Actions) ou `app/api/` (Route Handlers protégés) — jamais d'écriture Prisma directement depuis un composant.
- `requireRole()` est systématiquement appelé en première ligne de toute Server Action ou Route Handler touchant à une donnée sensible.
- Toute requête Prisma sur des tables sensibles (`WeekPlanner`, `TimeEntry`, `Objective`, etc.) est scopée par rôle — jamais de requête non filtrée hors contexte Administrateur.
- Une semaine validée (`WeekPlanner.status = VALIDATED`) ne peut plus être modifiée — toute correction nécessite une nouvelle planification (Règle 8).
- Les `WeekPlannerTask` du jour ne sont visibles dans l'exécution quotidienne qu'après validation du Week Planner de la semaine (Règle 9).
- Un `WeekPlannerTask` avec `status = NOT_DONE` doit toujours avoir un `comment` non vide (Règle 12) — vérifié côté serveur, jamais seulement côté client.
- Un projet (`Project`) n'est disponible comme option de rattachement dans le Week Planner que lorsque `isConfirmed = true` (Règle 10) — la confirmation est binaire, jamais un statut intermédiaire type "rejeté".
- `currentStatus` (cycle de vie opérationnel du projet) et `isConfirmed` (porte d'accès Administrateur) sont deux champs indépendants — ne jamais déduire l'un de l'autre.
- Le `code` d'un `Project` est généré automatiquement et n'est jamais saisi manuellement ni modifiable après création.
- Chaque `Committee` doit avoir un `responsibleUserId`, une `frequency` et au moins un `CommitteeDepartment` avant de pouvoir planifier une `CommitteeMeeting`.
- Une `CommitteeMeeting` doit toujours avoir `meetingDate`, `startDateTime` et `endDateTime` renseignés avant sauvegarde — `meetingLink` reste optionnel (réunion en présentiel possible).
- Une `CommitteeAction` est toujours liée à une `CommitteeMeeting` précise (`meetingId`) — jamais directement à un `Committee` sans passer par la réunion où la décision a été prise.
- Un Collaborateur ne peut modifier un `GanttTask` que si `responsibleUserId === session.user.id`, et uniquement le champ `progressPercent` — jamais les dates, dépendances ou titre, même sur sa propre tâche.
- Un Collaborateur a accès en lecture aux `Committee` dont il est `CommitteeMember` (Participant ou Invité) — extension explicite de la matrice Modules × Rôles d'origine, confirmée par le client, jamais de droit d'édition sur le comité lui-même.
- Le navigateur ne demande la permission de notification qu'après un consentement explicite dans l'UI (`NotificationPermissionPrompt.tsx`) — jamais la popup native déclenchée sans contexte préalable.
- `lib/notify.ts` (`notifyUser()`) est le seul point d'entrée pour notifier un utilisateur — push si `notificationConsent = ACCEPTED` et abonnement actif, sinon email — jamais les deux canaux pour le même événement.
- `self.registration.showNotification()` n'est appelé que depuis `public/sw.js` — jamais depuis un script de page classique.
- Seul le propriétaire (`Objective.userId`) peut créer, modifier ou mettre à jour le statut d'un `KeyResult` — Manager et Administrateur n'ont qu'un accès en lecture sur les objectifs des autres, selon la configuration des permissions du module Administration.
- Un `KeyResult` de type `SKILLS_DEVELOPMENT` ne devrait passer à `status = DONE` qu'accompagné d'un `Attachment` (`relatedType = KEY_RESULT`) faisant foi de certificat — vérifié côté UI, jamais bloqué de façon rigide côté serveur (l'utilisateur reste responsable de la preuve qu'il fournit).
- Un mot de passe en clair (généré ou saisi par l'Administrateur) n'existe jamais que dans la requête de l'action `sendUserCredentials()` — jamais stocké en base, jamais loggé, jamais conservé après l'envoi de l'email.
- Un `PasswordResetOtp` est à usage unique (`usedAt`) et toujours invalidé par toute nouvelle demande de réinitialisation pour le même utilisateur — jamais deux codes valides simultanément.
- Les emails "credentials" et "otp-reset" sont toujours envoyés via Resend (email), jamais via `lib/notify.ts` (push) — ce sont des messages de sécurité, jamais soumis à la préférence de notification de l'utilisateur.
- Aucune valeur hex en dur ni classe Tailwind couleur brute dans les composants — utiliser les tokens de ui-tokens.md.
- Toute opération de hashage de mot de passe passe par `lib/password.ts` — jamais d'appel direct à `bcrypt` ailleurs.
- Le menu de la sidebar est filtré par rôle côté serveur avant d'être transmis au composant — jamais masqué uniquement en CSS/JS côté client.
- Chaque route `app/api/cron/*` vérifie le header `Authorization` contre `CRON_SECRET` avant tout traitement.
- Les exports PDF/CSV du Suivi ETP sont réservés au rôle Administrateur, conformément à la matrice de permissions.
- Le système ne gère qu'une seule entité — FACAM STAIRWAY (Règle 1) — aucune logique multi-tenant ne doit être introduite.
- Les données validées ne conservent que la dernière version — pas d'historique détaillé des modifications (Règle 13).
