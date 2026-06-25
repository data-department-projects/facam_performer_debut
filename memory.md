# Mémoire — Toutes les features complètes (1–32), code review & lint clean

Dernière mise à jour : 2026-06-24

## Ce qui a été créé

### Features 1–32 (projet entièrement terminé)
Le projet FACAM PERFORMER est complet. Toutes les features sont implémentées — voir `context/progress-tracker.md` pour le détail complet feature par feature.

### Corrections de code review appliquées cette session (8 bugs)

- **`app/projects/[id]/page.tsx`** — import `redirect` manquant (build fix)
- **`app/committees/[id]/page.tsx`** — guard COLLABORATOR : vérification d'appartenance au comité avant affichage
- **`actions/projects.ts` — `deleteProjectExpense`** — IDOR corrigé : ajout du check de propriété MANAGER (même pattern que `createProjectExpense`)
- **`actions/projects.ts` — `updateMyTaskProgress`** — validation changée : accepte uniquement `[0, 25, 50, 75, 100]`
- **`app/api/cron/meeting-reminder/route.ts`** — `reminderSentAt` mis à jour AVANT la boucle membres (idempotence) ; chaque envoi membre dans son propre try/catch
- **`components/week-planner/WeekDayBar.tsx`** — tokens Tailwind v4 invalides corrigés : `bg-white/60` → `bg-facamWhite/60`, `text-white/70` → `text-facamWhite/70`
- **`actions/weekPlanner.ts` — `createWeekPlanner`** — dates UTC via `Date.UTC()` au lieu de `new Date(str + "T00:00:00")` (bug timezone)
- **`actions/weekPlanner.ts` — `validateWeekPlanner`** — guard `departmentId` null avant comparaison (Prisma ignore silencieusement `undefined` dans `where`)
- **`actions/weekPlanner.ts` — `submitWeekPlanner`** — ADMIN bloqué (aucun validateur disponible pour son planning → resterait en SUBMITTED indéfiniment)
- **`actions/dailyExecution.ts`** — `hoursSpent: number | null` : `null` = ne pas toucher le TimeEntry, `0` = supprimer, `>0` = upsert ; logique TimeEntry encapsulée dans `if (hoursSpent !== null)`
- **`components/week-planner/DayTaskPanel.tsx`** — `hoursSpent: null` envoyé quand le champ heures est vide (évite la suppression silencieuse du TimeEntry à chaque re-sauvegarde)
- **`lib/schemas/weekPlanner.ts`** — `updateTaskExecutionSchema` accepte `z.union([z.null(), z.number()])` ; `createPlannerSchema` valide que la date est un lundi via `.refine()`
- **`app/week-planner/page.tsx`** — `getCurrentWeekMonday()` utilise `getUTCDay()`/`Date.UTC` ; param `?week` validé par regex `^\d{4}-\d{2}-\d{2}$` ; guard `if (!session.user.departmentId) redirect("/dashboard")` avant la query MANAGER
- **`lib/dashboard-queries.ts`** — INTERN inclus dans le dénominateur `availableHours` : `role: { in: ["COLLABORATOR", "INTERN"] }` (était seulement `"COLLABORATOR"`)

### Corrections ESLint appliquées (3 problèmes → 0)

- **`components/help/BugReportForm.tsx:41`** — `l'équipe` → `l&apos;équipe` (react/no-unescaped-entities)
- **`components/help/HelpView.tsx:17`** — `d'utilisation` → `d&apos;utilisation` (react/no-unescaped-entities)
- **`components/projects/GanttTaskFormModal.tsx:69`** — `watch("dependsOnIds")` → `useWatch({ control, name: "dependsOnIds" })` ; import `useWatch` ajouté, `watch` remplacé par `control` dans la destructure `useForm` (react-hooks/incompatible-library — React Compiler)

## Décisions prises

- **`hoursSpent: null` comme sentinelle** — `null` = l'utilisateur n'a pas touché le champ heures → ne pas modifier le TimeEntry existant. `0` = effacement explicite. Évite la suppression accidentelle lors de re-sauvegardes sans modifier les heures.
- **UTC partout pour les dates de planner** — `getCurrentWeekMonday()`, `createWeekPlanner`, `createPlannerSchema` refine, et les lookups Prisma utilisent tous `Date.UTC()`/`getUTC*()`. `setHours(0,0,0,0)` est banni (timezone local ≠ UTC sur serveur).
- **Prisma `where: { field: undefined }` = fuite de données** — un `departmentId` undefined dans un filtre Prisma supprime silencieusement le filtre, exposant des données d'autres départements. Toujours garder avec `redirect` avant la query.
- **`useWatch` au lieu de `watch()` dans les composants memoïsés** — `watch()` retourné par `useForm()` ne peut pas être memoïsé par le React Compiler. Utiliser `useWatch({ control, name })` à la place.

## Problèmes résolus

- **Suppression silencieuse de TimeEntry** — `DayTaskPanel` initialisait `hours: ""` mais le formulaire envoyait `parseFloat("") || 0 = 0` → le TimeEntry était supprimé à chaque sauvegarde sans que l'utilisateur ait touché le champ. Résolu via sentinelle `null`.
- **IDOR sur `deleteProjectExpense`** — un Manager pouvait supprimer les dépenses de n'importe quel projet. Résolu avec le même check de propriété que `createProjectExpense`.
- **Bug de timezone `getCurrentWeekMonday()`** — sur un serveur UTC+1/UTC+2, `toISOString()` après `setHours(0,0,0,0)` émettait la date du dimanche précédent. Résolu avec `getUTCDay()` + `Date.UTC()`.
- **`?week=abc` → crash Prisma** — param non validé passait directement dans `new Date()` → `Invalid Date` → Prisma lançait une erreur 500. Résolu avec validation regex.
- **INTERN exclu du dénominateur ETP** — le taux d'occupation était surestimé (numérateur incluait les INTERN, dénominateur non). Corrigé.

## État actuel

- **Branch :** `dev`
- **Features complètes :** 1–32 (toutes — projet entièrement terminé)
- **`npm run build` :** 0 erreur TypeScript ✅
- **`npm run lint` :** 0 erreur, 0 warning ✅
- **Pas de dette technique connue** — tous les bugs trouvés par les 2 passes de code review sont corrigés

## La prochaine session commencera par

Le projet est complet et propre. La prochaine étape logique est la **mise en production** :
1. `git add` des fichiers modifiés + `git commit` sur `dev`
2. `git merge dev → main` (ou PR `dev → main`)
3. Déploiement sur Vercel (branch `main`)
4. Vérifier que les variables d'environnement sont toutes configurées sur Vercel (voir liste dans `context/code-standards.md`, y compris `SUPPORT_EMAIL` ajouté en Feature 32)

## Questions en suspens

- **`SUPPORT_EMAIL`** — variable d'environnement ajoutée dans `.env.example` pour la Feature 32 (remontée de bugs). À configurer sur Vercel avant le déploiement.
- **Migration Prisma en prod** — `npx prisma migrate deploy` doit être exécuté sur la base de données de production avant le premier déploiement (ou via une étape de build Vercel).
- **Service Worker push** — `public/sw.js` doit être servi depuis la racine du domaine de production pour que les notifications push fonctionnent. Vérifier la config Vercel.
