# Library Docs — FACAM PERFORMER

Patterns d'utilisation spécifiques au projet pour chaque librairie tierce. Ce fichier couvre uniquement comment nous utilisons chaque librairie dans ce projet précis — règles, patterns et contraintes propres à FACAM PERFORMER.

Lire la section pertinente avant d'implémenter toute fonctionnalité qui touche ces librairies.

---

## Avant d'Utiliser une Librairie

Avant d'implémenter une fonctionnalité utilisant une librairie tierce :

1. **Vérifier AGENTS.md** à la racine du projet — il liste chaque skill installé et comment l'utiliser. Les skills contiennent une documentation API à jour, des patterns d'utilisation et les bonnes pratiques propres à cette base de code.

2. **Vérifier si un serveur MCP est configuré** pour cette librairie. Certains outils ont des serveurs MCP donnant à l'agent IA un accès direct à la documentation, aux logs et aux outils de débogage. Si un serveur MCP est disponible — l'utiliser avant de se reposer sur la connaissance générale.

3. **Lire ce fichier** pour les patterns spécifiques au projet qui prennent le pas sur la connaissance générale d'une librairie.

L'ordre d'autorité est :

```
Serveur MCP (docs temps réel) → Skills via AGENTS.md → Ce fichier (règles projet) → Connaissance générale d'entraînement
```

Ne jamais se reposer uniquement sur la connaissance générale d'entraînement pour les API d'une librairie — elles changent fréquemment et les données d'entraînement peuvent être obsolètes.

---

## Prisma

**Vérifier d'abord :** AGENTS.md pour un skill Prisma installé. Les APIs de migration et de query peuvent évoluer entre versions majeures.

### Client Singleton

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

### Requêtes scopées par rôle

```typescript
// Collaborateur — uniquement ses propres données
const myTasks = await prisma.weekPlannerTask.findMany({
  where: { weekPlanner: { userId: session.user.id } },
});

// Manager — périmètre de son équipe (via la hiérarchie organigramme)
const teamWeekPlanners = await prisma.weekPlanner.findMany({
  where: { user: { team: { managerId: session.user.id } } },
  include: { tasks: true, user: true },
});

// Admin — accès complet, jamais de filtre obligatoire
const allProjects = await prisma.project.findMany({ include: { members: true } });
```

### Transactions — Validation de semaine (Règle 8)

```typescript
// Une fois validée, la semaine devient non modifiable
await prisma.$transaction(async (tx) => {
  await tx.weekPlanner.update({
    where: { id: weekPlannerId },
    data: { status: "VALIDATED", validatedAt: new Date(), validatedById: managerId },
  });
  await tx.weekPlannerTask.updateMany({
    where: { weekPlannerId },
    data: { isLocked: true },
  });
});
```

### Migrations

```bash
npx prisma migrate dev --name add_week_planner_lock
npx prisma generate
```

**Règles :**

- `lib/prisma.ts` exporte une instance singleton — jamais de `new PrismaClient()` ailleurs
- Toute requête sur week_planner, time_entry, objective doit être scopée — par userId (Collaborateur), par équipe via la hiérarchie (Manager), ou non filtrée (Admin uniquement)
- Les opérations multi-tables qui doivent réussir ou échouer ensemble (validation semaine, validation projet) passent toujours par `prisma.$transaction`
- Jamais de modification de schéma hors `prisma migrate dev` — jamais d'ALTER TABLE manuel
- Toujours `prisma generate` après une modification du schéma, avant de continuer le développement

---

## Auth.js (NextAuth v5) — Credentials

**Vérifier d'abord :** AGENTS.md pour un skill Auth.js installé. Les patterns de configuration ont changé significativement entre NextAuth v4 et v5.

### Configuration

```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.isActive) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash,
        );
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
        };
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
      session.user.role = token.role as Role;
      session.user.departmentId = token.departmentId as string;
      return session;
    },
  },
});
```

### Extension de type de session

```typescript
// types/next-auth.d.ts
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    departmentId: string;
  }
  interface Session {
    user: User & { id: string };
  }
}
```

### Middleware de protection

```typescript
// middleware.ts
import { auth } from "@/lib/auth";

export default auth((req) => {
  const protectedPaths = ["/dashboard", "/projects", "/week-planner", "/admin", "/org-chart"];
  const isProtected = protectedPaths.some((p) => req.nextUrl.pathname.startsWith(p));
  if (isProtected && !req.auth) {
    return Response.redirect(new URL("/login", req.url));
  }
});

export const config = { matcher: ["/dashboard/:path*", "/projects/:path*", "/week-planner/:path*", "/admin/:path*", "/org-chart/:path*"] };
```

### Flux mot de passe oublié

```typescript
// actions/auth.ts
"use server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 chiffres
}

export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: true }; // ne jamais révéler si l'email existe

    // Une seule demande active à la fois — invalide les codes précédents
    await prisma.passwordResetOtp.deleteMany({ where: { userId: user.id, usedAt: null } });

    const code = generateOtpCode();
    await prisma.passwordResetOtp.create({
      data: { userId: user.id, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });
    await sendEmail({
      to: user.email,
      template: "otp-reset",
      data: { code },
    });
    return { success: true };
  } catch (error) {
    console.error("[actions/auth]", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}

export async function verifyOtpAndResetPassword(
  email: string,
  code: string,
  newPassword: string,
) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: false, error: "Code invalide" };

    const otp = await prisma.passwordResetOtp.findFirst({
      where: { userId: user.id, code, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!otp) return { success: false, error: "Code invalide ou expiré" };

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(newPassword) },
      }),
      prisma.passwordResetOtp.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
    ]);
    return { success: true };
  } catch (error) {
    console.error("[actions/auth]", error);
    return { success: false, error: "Une erreur est survenue" };
  }
}
```

**Règles :**

- Stratégie de session : JWT — Credentials ne supporte pas les sessions base de données
- Jamais de divulgation si un email existe ou non lors d'une demande de réinitialisation (toujours `{ success: true }`)
- Réinitialisation par OTP — code à 6 chiffres, jamais de lien. Expiration 10 minutes, usage unique
- Toute nouvelle demande supprime les codes non utilisés précédents du même utilisateur — un seul code valide à la fois
- `role` et `departmentId` injectés dans le JWT à la connexion — jamais re-fetchés à chaque requête pour les vérifications basiques
- Middleware vérifie la présence de session uniquement — le contrôle fin par rôle se fait dans `lib/permissions.ts` (voir code-standards.md)

---

## Génération de Mot de Passe & Envoi des Identifiants (Administrateur)

**Vérifier d'abord :** AGENTS.md pour un skill de génération de mot de passe installé, le cas échéant.

### Génération côté client

```typescript
// lib/generate-password.ts
export function generateRandomPassword(length = 12): string {
  const charset =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (b) => charset[b % charset.length]).join("");
}
```

### Envoi des identifiants (Server Action)

```typescript
// actions/users.ts
"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { hashPassword } from "@/lib/password";
import { sendEmail } from "@/lib/email";

export async function sendUserCredentials(userId: string, plainPassword: string) {
  try {
    await requireRole(["ADMIN"]);
    const user = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(plainPassword) },
    });
    await sendEmail({
      to: user.email,
      template: "credentials",
      data: { email: user.email, password: plainPassword },
    });
    return { success: true };
  } catch (error) {
    console.error("[actions/users]", error);
    return { success: false, error: "Impossible d'envoyer les identifiants" };
  }
}
```

**Règles :**

- `generateRandomPassword()` tourne côté navigateur (`crypto.getRandomValues`), uniquement pour pré-remplir le champ du formulaire — jamais envoyé au serveur avant validation explicite de l'Admin
- `sendUserCredentials()` hash et persiste le mot de passe au moment précis de l'envoi — garantit que l'email envoyé correspond toujours exactement au mot de passe stocké
- Le mot de passe en clair ne transite que dans cette requête — jamais stocké, jamais loggé, jamais conservé après l'envoi
- Réservé au rôle `ADMIN` — jamais accessible à un Manager même sur son propre périmètre
- Template "credentials" toujours envoyé via Resend (email) — jamais via le canal push, quel que soit le consentement notification de l'utilisateur concerné

---

## bcrypt

**Vérifier d'abord :** AGENTS.md pour un skill bcrypt installé.

```typescript
// lib/password.ts
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

**Règles :**

- Coût fixé à 12 — jamais inférieur
- Jamais de mot de passe en clair logué, stocké, ou envoyé par email
- Toujours passer par `lib/password.ts` — jamais d'appel direct à `bcrypt` ailleurs dans le code

---

## AWS S3 (@aws-sdk/client-s3)

**Vérifier d'abord :** AGENTS.md pour un skill AWS S3 installé. Le SDK v3 (modulaire) est la seule version utilisée — jamais le SDK v2.

### Client

```typescript
// lib/s3-client.ts
import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
```

### Upload d'un justificatif/livrable

```typescript
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/s3-client";

export async function uploadAttachment(
  projectId: string,
  taskId: string,
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
) {
  const key = `attachments/${projectId}/${taskId}/${fileName}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    }),
  );
  return key;
}
```

### URL signée pour téléchargement (bucket privé)

```typescript
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/s3-client";

export async function getAttachmentUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
}
```

**Chemins de stockage :**

- Justificatifs / livrables de tâche : `attachments/{projectId}/{taskId}/{fileName}`
- Import de planning Excel (archive) : `gantt-imports/{projectId}/{fileName}`

**Règles :**

- Bucket toujours privé — jamais d'URL publique permanente, toujours une URL signée à courte expiration (5 min)
- SDK v3 modulaire uniquement (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) — jamais `aws-sdk` v2
- Jamais d'écriture de fichier sur disque — toujours upload direct du buffer
- La clé S3 (`key`) est sauvegardée en base sur l'enregistrement concerné — jamais l'URL signée (elle expire)

---

## Resend

**Vérifier d'abord :** AGENTS.md pour un skill Resend installé.

### Client et envoi

```typescript
// lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

type EmailTemplate = "otp-reset" | "credentials" | "daily-reminder" | "weekly-reminder" | "meeting-reminder";

export async function sendEmail(params: {
  to: string;
  template: EmailTemplate;
  data: Record<string, string>;
}) {
  try {
    await resend.emails.send({
      from: "FACAM PERFORMER <notifications@facam-performer.com>",
      to: params.to,
      subject: subjectFor(params.template),
      html: renderTemplate(params.template, params.data),
    });
  } catch (error) {
    console.error("[lib/email]", error);
    // ne jamais relancer — un email qui échoue ne doit pas faire échouer l'action appelante
  }
}
```

**Règles :**

- Toujours encapsulé dans try/catch — un échec d'envoi ne doit jamais faire planter une Server Action ou un cron
- Templates centralisés dans `lib/email-templates/` — jamais de HTML inline dans les Server Actions
- `from` toujours le domaine vérifié Resend — jamais une adresse non vérifiée

---

## web-push — Notifications Desktop (façon WhatsApp Web)

**Vérifier d'abord :** AGENTS.md pour un skill web-push installé.

### Génération des clés VAPID (une seule fois)

```bash
npx web-push generate-vapid-keys
```

### Service Worker (navigateur)

```javascript
// public/sw.js
self.addEventListener("push", (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

### Abonnement côté client

```typescript
// lib/push-client.ts
export async function subscribeToPush(): Promise<PushSubscriptionJSON | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

  const registration = await navigator.serviceWorker.register("/sw.js");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  });

  return subscription.toJSON();
}
```

### Envoi côté serveur

```typescript
// lib/web-push.ts
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; url: string },
) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true as const };
  } catch (error) {
    console.error("[lib/web-push]", error);
    return { success: false as const, error: String(error) };
  }
}
```

### Routage Email vs Push

```typescript
// lib/notify.ts
import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/web-push";
import { sendEmail } from "@/lib/email";

export async function notifyUser(
  userId: string,
  payload: { title: string; body: string; url: string },
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { pushSubscriptions: true },
  });
  if (!user) return;

  if (user.notificationConsent === "ACCEPTED" && user.pushSubscriptions.length > 0) {
    for (const sub of user.pushSubscriptions) {
      const result = await sendPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dhKey, auth: sub.authKey } },
        payload,
      );
      if (!result.success) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
    return;
  }

  await sendEmail({
    to: user.email,
    template: "meeting-reminder",
    data: { title: payload.title, url: payload.url },
  });
}
```

**Règles :**

- Le navigateur ne demande la permission qu'après un consentement explicite dans l'UI (`NotificationPermissionPrompt.tsx`) — jamais la popup native déclenchée sans contexte
- Si l'abonnement échoue ou si la permission est refusée — `notificationConsent` passe à `DECLINED`, jamais d'erreur bloquante pour l'utilisateur
- `self.registration.showNotification()` n'est appelé que depuis `public/sw.js` — jamais depuis un script de page classique
- `notifyUser()` est le seul point d'entrée pour notifier un utilisateur — choisit automatiquement push ou email, jamais les deux pour le même événement
- Si l'envoi push échoue (souscription expirée ou invalide), supprimer la `PushSubscription` correspondante immédiatement et retomber sur l'email pour cet envoi précis

---

## Vercel Cron — Rappels automatiques

**Vérifier d'abord :** AGENTS.md pour un skill Vercel Cron installé. La syntaxe `vercel.json` peut évoluer.

### Configuration

```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/daily-reminder", "schedule": "0 8 * * 1-5" },
    { "path": "/api/cron/weekly-reminder", "schedule": "0 15 * * 5" },
    { "path": "/api/cron/meeting-reminder", "schedule": "0 * * * *" }
  ]
}
```

### Route protégée

```typescript
// app/api/cron/weekly-reminder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
  }
  try {
    const users = await prisma.user.findMany({ where: { isActive: true } });
    for (const user of users) {
      await sendEmail({ to: user.email, template: "weekly-reminder", data: { name: user.fullName } });
    }
    return NextResponse.json({ success: true, data: { sent: users.length } });
  } catch (error) {
    console.error("[cron/weekly-reminder]", error);
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}
```

**Règles :**

- Chaque route cron vérifie le header `Authorization` contre `CRON_SECRET` avant tout traitement
- Rappel quotidien : jours ouvrés uniquement (lundi-vendredi)
- Rappel hebdomadaire : vendredi 15h, fuseau horaire du projet de déploiement Vercel à vérifier (UTC par défaut — ajuster l'expression cron si besoin)
- L'échec d'envoi pour un utilisateur ne doit jamais interrompre la boucle — chaque envoi isolé dans son propre try/catch via `sendEmail`

---

## xlsx — Import du planning Gantt

**Vérifier d'abord :** AGENTS.md pour un skill xlsx installé.

### Lecture du fichier importé

```typescript
// lib/gantt-import.ts
import * as XLSX from "xlsx";
import { z } from "zod";

const ganttRowSchema = z.object({
  Tache: z.string().min(1),
  DateDebut: z.coerce.date(),
  DateFin: z.coerce.date(),
  Responsable: z.string().email(),
  Dependances: z.string().optional(),
});

export function parseGanttTemplate(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const parsed = rows.map((row) => ganttRowSchema.safeParse(row));
  const errors = parsed.filter((p) => !p.success);
  if (errors.length > 0) {
    return { success: false as const, error: "Le fichier ne correspond pas au template attendu" };
  }
  return { success: true as const, data: parsed.map((p) => p.data!) };
}
```

**Règles :**

- Le template attendu a des en-têtes fixes : `Tache`, `DateDebut`, `DateFin`, `Responsable`, `Dependances` — jamais de détection dynamique des colonnes
- Chaque ligne validée avec Zod avant tout insert — fichier rejeté en bloc si une seule ligne échoue (jamais d'import partiel silencieux)
- `Responsable` doit correspondre à un email d'utilisateur existant — vérifié avant l'insertion des tâches
- Toujours lire depuis un buffer en mémoire — jamais d'écriture du fichier Excel sur disque

---

## gantt-task-react — Vue Gantt

**Vérifier d'abord :** AGENTS.md pour un skill gantt-task-react installé.

### Rendu

```typescript
"use client";

import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";

type Props = {
  tasks: Task[];
  readOnly: boolean;
  onTaskChange: (task: Task) => void;
};

export function ProjectGanttView({ tasks, readOnly, onTaskChange }: Props) {
  return (
    <Gantt
      tasks={tasks}
      viewMode={ViewMode.Week}
      onDateChange={readOnly ? undefined : onTaskChange}
      onProgressChange={readOnly ? undefined : onTaskChange}
      listCellWidth={readOnly ? "" : "155px"}
    />
  );
}
```

### Mapping Prisma → Task[]

```typescript
import { Task } from "gantt-task-react";
import type { GanttTask } from "@prisma/client";

export function toGanttTasks(rows: GanttTask[]): Task[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.title,
    start: row.startDate,
    end: row.endDate,
    progress: row.progressPercent,
    type: "task",
    dependencies: row.dependsOnIds,
  }));
}
```

**Règles :**

- `readOnly` toujours `true` pour le Collaborateur — seuls Manager (sur son projet, avant validation Admin) et Admin peuvent modifier les barres
- Une fois le projet validé par l'Administrateur (Règle 10), le composant passe en `readOnly` même pour le Manager — toute modification nécessite une nouvelle planification
- `onDateChange` / `onProgressChange` appellent toujours une Server Action qui revalide les permissions côté serveur — jamais de confiance dans l'état `readOnly` côté client seul
- CSS du composant importé une seule fois, au niveau du composant qui l'utilise — jamais dans le layout global

---

## react-hook-form + zod

**Vérifier d'abord :** AGENTS.md pour un skill react-hook-form installé.

### Pattern de formulaire

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { weekPlannerTaskSchema, WeekPlannerTaskInput } from "@/lib/schemas/weekPlanner";
import { createWeekPlannerTask } from "@/actions/weekPlanner";

export function WeekPlannerTaskForm({ weekPlannerId }: { weekPlannerId: string }) {
  const form = useForm<WeekPlannerTaskInput>({ resolver: zodResolver(weekPlannerTaskSchema) });

  const onSubmit = async (data: WeekPlannerTaskInput) => {
    const result = await createWeekPlannerTask({ ...data, weekPlannerId });
    if (!result.success) {
      form.setError("root", { message: result.error });
    }
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>{/* champs */}</form>;
}
```

### Schémas partagés

```typescript
// lib/schemas/weekPlanner.ts
import { z } from "zod";

export const weekPlannerTaskSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  projectId: z.string().optional(), // tâche hors-projet si absent — Règle 11
  plannedDay: z.enum(["MON", "TUE", "WED", "THU", "FRI"]),
});

export type WeekPlannerTaskInput = z.infer<typeof weekPlannerTaskSchema>;
```

**Règles :**

- Chaque formulaire a son schéma Zod dans `lib/schemas/` — réutilisé tel quel côté Server Action pour revalider (jamais de confiance dans la seule validation client)
- `zodResolver` toujours utilisé — jamais de validation manuelle dans `onSubmit`
- Les messages d'erreur de validation sont en français et orientés utilisateur final

---

## recharts

**Vérifier d'abord :** AGENTS.md pour un skill recharts installé.

### Pattern serveur → client

```typescript
// app/dashboard/page.tsx (Server Component)
import { getTaskCompletionRate } from "@/lib/dashboard-queries";
import { TaskCompletionChart } from "@/components/dashboard/TaskCompletionChart";

export default async function DashboardPage() {
  const data = await getTaskCompletionRate();
  return <TaskCompletionChart data={data} />;
}
```

```typescript
// components/dashboard/TaskCompletionChart.tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

type Props = { data: { day: string; rate: number }[] };

export function TaskCompletionChart({ data }: Props) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis dataKey="day" />
        <YAxis />
        <Bar dataKey="rate" fill="var(--chart-primary)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

**Règles :**

- Les données du graphique sont toujours calculées côté serveur (Prisma) puis passées en props — jamais de fetch dans le composant chart
- Le composant chart est toujours `"use client"` (recharts utilise des hooks internes) mais ne contient aucune logique de récupération de données
- État vide explicite si le tableau de données est vide — jamais un graphique cassé ou silencieux
- Couleurs toujours via variables CSS (`var(--chart-primary)`, etc.) — jamais de couleur hexadécimale en dur

---

## date-fns

**Vérifier d'abord :** AGENTS.md pour un skill date-fns installé.

### Bornes de semaine (Week Planner)

```typescript
import { startOfWeek, endOfWeek, format } from "date-fns";
import { fr } from "date-fns/locale";

export function getWeekBounds(date: Date) {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }), // lundi
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function formatDisplayDate(date: Date): string {
  return format(date, "EEEE d MMMM yyyy", { locale: fr });
}
```

**Règles :**

- `weekStartsOn: 1` toujours — la semaine commence le lundi (jamais le dimanche par défaut)
- Locale `fr` toujours importée pour tout affichage de date à l'utilisateur
- Jamais de manipulation de date manuelle (concatenation de chaînes) — toujours via les fonctions date-fns

---

## shadcn/ui

**Vérifier d'abord :** AGENTS.md pour un skill shadcn/ui installé. La CLI et les composants disponibles évoluent.

```bash
npx shadcn@latest add table calendar progress badge
```

**Règles :**

- Toujours ajouter via la CLI — jamais de copier-coller manuel d'un composant
- Les composants générés dans `components/ui/` ne sont jamais modifiés directement — pour personnaliser, créer un wrapper dans `components/{feature}/`
- Les tokens de couleur (statuts de tâche, badges de match, etc.) suivent `ui-tokens.md` — jamais de couleur Tailwind brute (`bg-green-500`) en dehors de ce fichier de référence

---

## @react-pdf/renderer — Export Rapports (PDF)

**Vérifier d'abord :** AGENTS.md pour un skill react-pdf installé. Les APIs de génération PDF peuvent différer des données d'entraînement.

### Génération du rapport de consolidation

```typescript
// lib/reports/etp-report.tsx
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica" },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  row: { flexDirection: "row", borderBottom: 1, paddingVertical: 4 },
  cell: { fontSize: 9, width: "25%" },
  headerCell: { fontSize: 9, width: "25%", fontWeight: "bold" },
});

type EtpRow = { collaborateur: string; departement: string; heuresDeclarees: number; tauxOccupation: number };

function EtpReportDocument({ rows, period }: { rows: EtpRow[]; period: string }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Suivi ETP — {period}</Text>
        <View style={styles.row}>
          <Text style={styles.headerCell}>Collaborateur</Text>
          <Text style={styles.headerCell}>Département</Text>
          <Text style={styles.headerCell}>Heures déclarées</Text>
          <Text style={styles.headerCell}>Taux d&apos;occupation</Text>
        </View>
        {rows.map((row, i) => (
          <View style={styles.row} key={i}>
            <Text style={styles.cell}>{row.collaborateur}</Text>
            <Text style={styles.cell}>{row.departement}</Text>
            <Text style={styles.cell}>{row.heuresDeclarees}h</Text>
            <Text style={styles.cell}>{row.tauxOccupation}%</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}

export async function generateEtpReportPdf(rows: EtpRow[], period: string): Promise<Buffer> {
  return renderToBuffer(<EtpReportDocument rows={rows} period={period} />);
}
```

### Route de téléchargement

```typescript
// app/api/reports/etp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { getEtpConsolidation } from "@/lib/dashboard-queries";
import { generateEtpReportPdf } from "@/lib/reports/etp-report";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    const period = req.nextUrl.searchParams.get("period") ?? "current";
    const rows = await getEtpConsolidation(period);
    const buffer = await generateEtpReportPdf(rows, period);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="suivi-etp-${period}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[reports/etp]", error);
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}
```

**Règles :**

- Génération PDF strictement côté serveur — jamais importé dans un composant `"use client"`
- Toujours `renderToBuffer` — jamais `renderToStream` ni `PDFDownloadLink` (incompatible avec les Route Handlers)
- Réservé au rôle Administrateur, conformément à la matrice de permissions du module Suivi ETP
- Seules ces propriétés CSS sont supportées (les autres sont silencieusement ignorées) : `padding, margin, fontSize, color, fontFamily, flexDirection, alignItems, justifyContent, borderRadius, width, height, fontWeight, textAlign, lineHeight`
- Le buffer est streamé directement dans la réponse HTTP — jamais écrit sur disque ni uploadé sur S3 (rapport à la demande, non persistant)

---

## Export CSV — Suivi ETP

Pas de librairie tierce nécessaire — génération native pour un cas simple (tableau plat, pas de mise en forme).

```typescript
// lib/reports/csv-export.ts
export function rowsToCsv<T extends Record<string, string | number>>(rows: T[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) =>
    typeof value === "string" && value.includes(",") ? `"${value}"` : String(value);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];
  return lines.join("\n");
}
```

```typescript
// app/api/reports/etp/csv/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/permissions";
import { getEtpConsolidation } from "@/lib/dashboard-queries";
import { rowsToCsv } from "@/lib/reports/csv-export";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);
    const period = req.nextUrl.searchParams.get("period") ?? "current";
    const rows = await getEtpConsolidation(period);
    const csv = rowsToCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="suivi-etp-${period}.csv"`,
      },
    });
  } catch (error) {
    console.error("[reports/etp/csv]", error);
    return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
  }
}
```

**Règles :**

- `rowsToCsv` reste générique et minimal — pas de librairie (`papaparse`, etc.) tant que les besoins restent un export plat sans agrégation complexe
- `charset=utf-8` toujours précisé — évite les accents cassés à l'ouverture dans Excel
- Mêmes règles de permission que l'export PDF (réservé Admin)
