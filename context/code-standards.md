# Code Standards — FACAM PERFORMER

Règles d'implémentation et conventions pour l'ensemble du projet. L'agent IA doit les suivre dans chaque session sans exception. Ces règles évitent la dérive des patterns entre les sessions.

---

## Mentalité d'Ingénierie

L'agent IA sur ce projet opère comme un ingénieur senior. Cela signifie :

- **Réfléchir avant d'implémenter** — comprendre ce qui est construit et pourquoi avant d'écrire une seule ligne
- **Lire le contexte d'abord** — ne jamais supposer, toujours vérifier par rapport à architecture.md et au cahier des charges
- **Le périmètre est sacré** — ne construire que ce que la fonctionnalité en cours exige. Ne jamais dépasser le périmètre même si cela semble utile
- **Chaque fonctionnalité doit être testable** — si elle ne peut pas être vérifiée immédiatement après implémentation, elle est incomplète
- **Propre plutôt qu'astucieux** — un code simple et lisible qu'un développeur junior peut comprendre est toujours préféré à une abstraction clever
- **Une chose à la fois** — terminer complètement une fonctionnalité avant de toucher à la suivante
- **Les échecs sont attendus** — encapsuler les opérations sensibles (DB, S3, emails, push) dans des try/catch, logger les échecs, ne jamais laisser un échec faire planter tout le reste

---

## TypeScript

- Mode strict activé dans tsconfig.json — aucune exception
- Ne jamais utiliser `any` — utiliser `unknown` et affiner le type
- Ne jamais utiliser d'assertions de type (`as SomeType`) sauf absolue nécessité, et commenter pourquoi
- Tous les paramètres de fonction et types de retour doivent être explicitement typés
- Utiliser `type` pour les formes d'objets et unions — `interface` uniquement pour les props de composants extensibles
- Toutes les fonctions async doivent avoir une gestion d'erreur propre — jamais de promesse non gérée
- Utiliser `const` par défaut — `let` uniquement si réassignation nécessaire

---

## Conventions Next.js (App Router)

- App Router uniquement — pas de Pages Router
- Tous les composants sont des Server Components par défaut
- N'ajouter `"use client"` que si le composant nécessite :
  - useState ou useReducer
  - useEffect
  - API navigateur (y compris Notification API, Service Worker, PushManager)
  - Event listeners
  - Librairies tierces client-only (ex. composants de graphiques interactifs)
- Ne jamais ajouter `"use client"` aux fichiers layout sauf nécessité absolue
- La récupération de données se fait dans les Server Components — jamais de fetch direct dans un Client Component
- Route Handlers dans `app/api/` — jamais de logique métier directement dans le route handler
- Server Actions dans `actions/` — jamais de Server Action définie inline dans un composant
- Pas de cache par défaut — tout le code dynamique s'exécute à la requête (données métier critiques : pas de données périmées)
- Toujours consulter la documentation Next.js avant d'implémenter une fonctionnalité spécifique — les API peuvent différer des données d'entraînement

---

## Nommage des Fichiers et Dossiers

- Dossiers : kebab-case — `week-planner`, `gantt-chart`, `org-chart`
- Fichiers de composants : PascalCase — `WeekPlannerGrid.tsx`, `ProjectGanttView.tsx`
- Fichiers utilitaires : camelCase — `permissions.ts`, `s3-client.ts`, `webPush.ts`
- Fichiers de types : camelCase — `index.ts`
- Fichiers de route API : toujours `route.ts`
- Fichiers de Server Actions : camelCase — `projects.ts`, `weekPlanner.ts`, `notifications.ts`
- Un composant par fichier — jamais plusieurs composants exportés d'un même fichier
- Index files uniquement dans `components/ui/` — jamais de barrel export ailleurs

---

## Structure des Composants

Chaque composant suit cet ordre exact :

```typescript
"use client"; // uniquement si nécessaire

// 1. Imports externes
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Imports internes
import { TaskStatusBadge } from "@/components/week-planner/TaskStatusBadge";

// 3. Définitions de types
type Props = {
  weekPlannerId: string;
  isLocked: boolean;
};

// 4. Composant
export function ComponentName({ weekPlannerId, isLocked }: Props) {
  // state
  // valeurs dérivées
  // handlers
  // return JSX
}
```

- Jamais d'export par défaut pour les composants — toujours des exports nommés
- Le type des props est défini juste au-dessus du composant — pas dans un fichier de types séparé sauf s'il est partagé
- Pas de styles inline — tout le style via classes Tailwind utilisant les variables CSS de ui-tokens.md

---

## Route Handlers API

```typescript
// app/api/week-planner/validate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 401 },
      );
    }
    const body = await req.json();
    // valider le body
    // appeler la logique métier
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[week-planner/validate]", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
```

- Chaque route handler a un try/catch
- Chaque route handler valide la session (rôle + département) avant de traiter
- Chaque route handler valide le corps de la requête avant traitement
- Les erreurs sont loggées avec le chemin de la route en préfixe : `[week-planner/validate]`
- Toujours retourner `{ success: boolean, data?: T, error?: string }`
- Ne jamais retourner de données brutes sans le wrapper success

---

## Server Actions

```typescript
// actions/projects.ts

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";

export async function createProject(input: CreateProjectInput) {
  try {
    const session = await requireRole(["ADMIN", "MANAGER"]);
    // valider input
    const project = await prisma.project.create({ data: { ...input, projectManagerId: input.projectManagerId } });
    revalidatePath("/projects");
    return { success: true, data: project };
  } catch (error) {
    console.error("[actions/projects]", error);
    return { success: false, error: "Impossible de créer le projet" };
  }
}
```

- Chaque Server Action a un try/catch
- Chaque Server Action vérifie le rôle requis via `requireRole()` avant toute écriture
- Chaque Server Action retourne `{ success: boolean, data?: T, error?: string }`
- Toujours appeler `revalidatePath` après une mutation qui affecte les données d'une page
- Ne jamais lever d'exception depuis une Server Action — toujours retourner l'erreur

---

## Accès à la Base de Données — Prisma

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- `lib/prisma.ts` exporte une instance singleton — jamais de `new PrismaClient()` ailleurs dans le code
- Prisma Client est utilisé uniquement côté serveur (Server Components, Server Actions, Route Handlers) — jamais importé dans un fichier `"use client"`
- Toute requête sur des données utilisateur doit être scopée par `departmentId` ou `userId` selon le rôle — jamais de requête non filtrée sur des tables sensibles (week_planners, time_entries, objectives)
- Les migrations Prisma (`prisma migrate dev`) sont la seule façon de modifier le schéma — jamais d'ALTER TABLE manuel
- Les relations critiques (Règle 5 : un projet a un Chef de Projet unique) sont imposées au niveau du schéma Prisma, pas seulement en validation applicative

---

## Authentification — Auth.js (Credentials)

```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const user = await prisma.user.findUnique({ where: { email: credentials.email as string } });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, role: user.role, departmentId: user.departmentId };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.departmentId = user.departmentId;
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.role = token.role;
      session.user.departmentId = token.departmentId;
      return session;
    },
  },
});
```

- Stratégie de session : JWT (le provider Credentials ne supporte pas les sessions base de données)
- `role` et `departmentId` sont injectés dans le token à la connexion — jamais re-fetchés à chaque requête pour la vérification de permission basique
- Hashage des mots de passe avec `bcrypt` (coût 12 minimum) — jamais de mot de passe en clair, jamais de hash maison
- Le flux "mot de passe oublié" utilise un token à usage unique stocké en base avec expiration (1h), jamais le mot de passe lui-même envoyé par email
- Middleware (`middleware.ts`) protège toutes les routes authentifiées en vérifiant la session avant rendu

---

## Contrôle d'Accès par Rôle (RBAC)

Le système ne gère que trois rôles fixes : `ADMIN`, `MANAGER`, `COLLABORATOR`. Un utilisateur ne peut avoir qu'un seul rôle à la fois (Règle 2).

```typescript
// lib/permissions.ts
import { auth } from "@/lib/auth";

type Role = "ADMIN" | "MANAGER" | "COLLABORATOR";

export async function requireRole(allowed: Role[]) {
  const session = await auth();
  if (!session || !allowed.includes(session.user.role)) {
    throw new Error("Permission refusée");
  }
  return session;
}
```

- `requireRole()` est systématiquement appelé en première ligne de toute Server Action ou Route Handler touchant à une donnée sensible
- La matrice Modules × Rôles du cahier des charges est la seule source de vérité — toute extension explicitement validée par le client (ex. accès en lecture du Collaborateur aux Comités dont il est membre, mise à jour de ses propres tâches Gantt) doit être documentée dans architecture.md avant d'être codée
- Le filtrage "Manager → selon périmètre" se fait toujours via la hiérarchie département → sous-département → équipe, jamais par une liste codée en dur
- Un Collaborateur ne peut jamais modifier un enregistrement qu'il ne possède pas directement (sa propre tâche Gantt assignée, son propre Week Planner, ses propres objectifs) — toute exception à cette règle doit être un cas explicitement documenté, jamais une supposition
- Aucun composant ne décide seul de l'affichage selon le rôle sans passer par un helper centralisé (`hasPermission()` côté client, miroir de `requireRole()` côté serveur)

---

## Constantes Métier

Les règles de gestion du cahier des charges sont encodées une seule fois comme constantes, jamais répétées en dur dans le code.

```typescript
// lib/constants.ts
export const ROLES = ["ADMIN", "MANAGER", "COLLABORATOR"] as const;

export const TASK_STATUSES = ["STARTED", "IN_PROGRESS", "DONE", "NOT_DONE"] as const;

// Règle 12 — commentaire obligatoire si tâche non terminée
export const COMMENT_REQUIRED_STATUS = "NOT_DONE";

// Règle 8 — une semaine validée devient non modifiable
export const WEEK_PLANNER_LOCK_ON_VALIDATE = true;

// Rappels — cron
export const DAILY_REMINDER_CRON = "0 8 * * 1-5";
export const WEEKLY_REMINDER_CRON = "0 15 * * 5";
export const MEETING_REMINDER_CRON = "0 * * * *";

// Fenêtre de rappel de réunion — heures avant le début
export const MEETING_REMINDER_WINDOW_HOURS = 24;

// Objectifs
export const OBJECTIVE_TYPES = ["PERFORMANCE", "SKILLS_DEVELOPMENT"] as const;
export const KEY_RESULT_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "DONE"] as const;

// Réinitialisation par OTP & génération de mot de passe
export const OTP_LENGTH = 6;
export const OTP_EXPIRATION_MINUTES = 10;
export const GENERATED_PASSWORD_LENGTH = 12;
```

- Toute règle de gestion numérotée dans le cahier des charges qui se traduit en logique (seuils, verrous, statuts) doit avoir sa constante ici avant d'être utilisée ailleurs
- Ne jamais comparer une chaîne de statut ou de rôle en dur dans un composant ou une action — toujours importer depuis `lib/constants.ts`

---

## Notifications — Routage Email / Push

- `lib/notify.ts` (`notifyUser()`) est le seul point d'entrée pour notifier un utilisateur d'un événement (rappel de réunion, etc.) — jamais d'appel direct à `sendEmail()` ou `sendPushNotification()` depuis une Server Action ou un cron pour ce type d'événement
- Le choix du canal est entièrement déterminé par `User.notificationConsent` et la présence d'une `PushSubscription` active — jamais une préférence supposée ou codée en dur
- Jamais d'envoi simultané sur les deux canaux pour le même événement
- Une `PushSubscription` qui échoue à l'envoi est supprimée immédiatement, jamais réessayée indéfiniment
- Les templates `otp-reset` et `credentials` sont des messages de sécurité — toujours envoyés par email (Resend) directement, jamais via `notifyUser()` ni soumis au consentement de notification push de l'utilisateur

---

## Gestion des Erreurs

- Jamais de bloc catch vide — toujours logger ou traiter
- Les erreurs console incluent toujours un préfixe de contexte : `[module/fonction]`
- Les erreurs affichées à l'utilisateur doivent être lisibles — jamais le message d'erreur brut (notamment les erreurs Prisma)
- Les erreurs liées aux jobs planifiés (rappels email/push) sont loggées mais ne doivent jamais faire échouer le cron entier — chaque envoi est isolé dans son propre try/catch
- Les erreurs d'API renvoient `status: 500` avec un message générique — jamais d'exposition de la stack ou du message interne

---

## Variables d'Environnement

Toutes les variables sont définies dans `.env.local` en développement. Jamais de clé, URL ou secret en dur dans le code.

| Variable | Utilisée dans |
| --- | --- |
| `DATABASE_URL` | prisma/schema.prisma, lib/prisma.ts |
| `NEXTAUTH_SECRET` | lib/auth.ts |
| `NEXTAUTH_URL` | lib/auth.ts |
| `AWS_ACCESS_KEY_ID` | lib/s3-client.ts |
| `AWS_SECRET_ACCESS_KEY` | lib/s3-client.ts |
| `AWS_REGION` | lib/s3-client.ts |
| `AWS_S3_BUCKET_NAME` | lib/s3-client.ts |
| `RESEND_API_KEY` | lib/email.ts |
| `CRON_SECRET` | app/api/cron/*/route.ts |
| `VAPID_PUBLIC_KEY` | lib/web-push.ts |
| `VAPID_PRIVATE_KEY` | lib/web-push.ts |
| `VAPID_SUBJECT` | lib/web-push.ts (format `mailto:contact@facam...`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | lib/push-client.ts (même valeur que `VAPID_PUBLIC_KEY`, exposée au navigateur) |

Seule `NEXT_PUBLIC_VAPID_PUBLIC_KEY` a besoin du préfixe `NEXT_PUBLIC_` — c'est une clé publique par construction (VAPID), jamais un secret. Toute autre donnée sensible (DB, S3, Resend, VAPID privée) reste strictement côté serveur.

---

## Alias d'Import

Toujours utiliser l'alias `@/` — jamais d'import relatif remontant de plus d'un niveau.

```typescript
// Correct
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

// Jamais
import { Button } from "../../../components/ui/button";
```

---

## Commentaires

- Pas de commentaires expliquant ce que fait le code — le code doit être auto-explicite
- Commentaires uniquement pour le pourquoi — expliquer une décision non évidente
- Les fonctions touchant aux règles de verrouillage (semaine validée, confirmation projet) peuvent avoir un bref commentaire renvoyant à la règle du cahier des charges (ex. `// Règle 8`)
- Jamais de commentaire TODO laissé dans le code livré

---

## Dépendances

Ne jamais installer un nouveau package sans raison claire. Avant d'installer, vérifier :

1. shadcn/ui propose-t-il déjà ce composant ?
2. Next.js fournit-il déjà cette fonctionnalité ?
3. Existe-t-il une solution native plus simple ?

Dépendances approuvées pour ce projet :

- `@prisma/client` / `prisma` — client et CLI base de données
- `next-auth` (v5 / Auth.js) — authentification Credentials
- `bcrypt` — hashage des mots de passe
- `@aws-sdk/client-s3` / `@aws-sdk/s3-request-presigner` — stockage des justificatifs et livrables
- `resend` — emails transactionnels et rappels
- `web-push` — envoi de notifications push desktop (VAPID), alternative à l'email sur consentement
- `zod` — validation de schémas (formulaires + payloads API)
- `react-hook-form` + `@hookform/resolvers` — gestion des formulaires
- `gantt-task-react` — rendu de la vue Gantt
- `xlsx` — lecture du template Excel d'import du planning Gantt
- `date-fns` — manipulation des dates
- `recharts` — graphiques du tableau de bord
- `@react-pdf/renderer` — export PDF du Suivi ETP
- `lucide-react` — icônes
- `tailwindcss` — styling
- `shadcn/ui` — composants UI primitifs

Aucun autre package ne doit être installé sans mise à jour préalable de cette liste.
