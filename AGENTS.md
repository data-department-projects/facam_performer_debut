---
description: Instructions for building FACAM PERFORMER
globs: *
alwaysApply: true
---

# FACAM PERFORMER — Project Documentation Overview

## What is FACAM PERFORMER?

Internal performance management platform for FACAM STAIRWAY (single entity — no multi-tenant logic anywhere), covering:

- **Organigramme** — hierarchical Department → Sous-département → Équipe structure
- **Projets & Gantt** — fiche projet en 5 modules, planning Gantt, jalons, confirmation hiérarchique par l'Administrateur
- **Comités** — gouvernance de comité, réunions planifiées, actions décidées et suivi de réalisation
- **Week Planner** — planification hebdomadaire et exécution quotidienne des tâches
- **Suivi ETP & Temps** — consolidation du temps et de la charge (Administrateur uniquement)
- **Objectifs** — Objectif + Résultats Clés (type Performance ou Développement des compétences), avec risques et preuves
- **Notifications** — push desktop sur consentement (façon WhatsApp Web), repli automatique sur email
- **Tableau de bord** — KPIs et analytics filtrés par rôle

## Stack

| Couche | Outil |
| --- | --- |
| Framework | Next.js (App Router) |
| Base de données | PostgreSQL + Prisma |
| Authentification | Auth.js (NextAuth v5) — Credentials, sessions JWT |
| Stockage fichiers | AWS S3 (SDK v3) |
| Emails | Resend |
| Notifications push | web-push (VAPID) + Service Worker natif |
| Tâches planifiées | Vercel Cron |
| Vue Gantt | gantt-task-react |
| Import Excel | xlsx + Zod |
| PDF | @react-pdf/renderer |
| Graphiques | recharts |
| Formulaires | react-hook-form + Zod |
| Style | Tailwind CSS v4 + shadcn/ui |
| Langage | TypeScript strict |

Pas de service tiers de type BaaS unique (pas d'InsForge, pas de Supabase) — chaque brique (DB, auth, stockage, email, push) est un service séparé, intégré directement via son propre SDK/librairie. Pas d'agent IA, pas d'analytics produit sur ce projet.

---

## Installation

### 🚨 CRITICAL: Follow these steps in order

### Step 1: Read the Context Files

Avant d'écrire la première ligne de code, lire dans l'ordre : `context/architecture.md` (structure de dossiers + schéma), `context/build-plan.md` (périmètre de la fonctionnalité en cours), `context/progress-tracker.md` (ce qui est déjà fait), `context/code-standards.md` (conventions).

### Step 2: Install Dependencies

```bash
npm install
```

Toutes les dépendances approuvées sont listées dans `context/code-standards.md` — ne jamais en installer une qui n'y figure pas sans mettre à jour ce fichier d'abord.

### Step 3: Configure Environment Variables

```bash
cp .env.example .env.local
```

Renseigner `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`, `RESEND_API_KEY`, `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — liste complète dans `context/code-standards.md`.

### Step 4: Run Database Migrations

```bash
npx prisma migrate dev
npx prisma generate
```

Le schéma complet est dans `prisma/schema.prisma`, sourcé depuis `context/architecture.md` — toute modification de schéma passe par une migration Prisma, jamais par un ALTER TABLE manuel.

---

## Getting Detailed Documentation

### 🚨 CRITICAL: Always Read Context Files Before Writing Code

Ce projet n'a pas de serveur de documentation MCP externe — tous les patterns d'implémentation sont capturés dans le dossier `context/`. Avant d'implémenter toute fonctionnalité :

1. Vérifier `context/build-plan.md` pour le périmètre UI/Logique exact de la fonctionnalité
2. Vérifier `context/architecture.md` pour savoir où le code doit vivre (dossier, table, flux de données, invariant)
3. Vérifier `context/library-docs.md` pour le pattern d'usage exact de la librairie concernée
4. Vérifier `context/code-standards.md` pour le nommage, la gestion d'erreur et les conventions RBAC
5. Vérifier `context/ui-rules.md` et `context/ui-tokens.md` avant d'écrire la moindre UI
6. Vérifier `context/ui-registry.md` avant de construire un nouveau composant — reproduire l'existant avant d'en inventer

### Fichiers de contexte disponibles

- **architecture.md** — Stack, structure de dossiers, schéma de base de données, flux de données, invariants (COMMENCER ICI)
- **build-plan.md** — Liste des fonctionnalités phase par phase, avec périmètre UI/Logique
- **progress-tracker.md** — Ce qui est fait, ce qui est en cours, décisions prises pendant le build
- **code-standards.md** — Conventions TypeScript, Next.js, Server Actions, RBAC, dépendances approuvées
- **library-docs.md** — Patterns d'usage spécifiques au projet : Prisma, Auth.js, AWS S3, Resend, web-push, gantt-task-react, xlsx, react-hook-form, recharts, date-fns, @react-pdf/renderer, shadcn/ui
- **ui-rules.md** — Règles de layout, sidebar, cards, typographie, boutons
- **ui-tokens.md** — Tokens de design (couleurs, espacements, tokens de composants)
- **ui-registry.md** — Registre vivant des composants déjà construits — à mettre à jour après chaque composant

Ne jamais se reposer uniquement sur la connaissance générale d'entraînement pour un pattern de librairie — toujours vérifier `library-docs.md` d'abord, il prend le pas sur tout le reste.

---

## When to Use What

### Toujours des Server Actions pour la logique applicative déclenchée par l'UI :

- CRUD organigramme, utilisateurs, projets, tâches Gantt, comités, réunions, objectifs, résultats clés
- Validation de Week Planner, exécution quotidienne, déclaration de temps
- Envoi des identifiants utilisateur, mise à jour du consentement aux notifications

### Route Handlers pour les opérations déclenchées par l'infrastructure, jamais par un clic UI direct :

- Tous les crons (`app/api/cron/*`) — rappel quotidien, hebdomadaire, rappel de réunion
- Abonnement/désabonnement push (`app/api/push/*`)
- Exports PDF/CSV à la demande (`app/api/reports/*`)
- Handlers Auth.js (`app/api/auth/[...nextauth]`)

### Prisma directement seulement dans `lib/`, `actions/`, et les Route Handlers :

- Jamais dans un composant, jamais dans un fichier `"use client"`
- Toujours scopé par rôle (`userId`, hiérarchie d'équipe, ou non filtré pour l'Admin) — voir `requireRole()` dans `code-standards.md`

---

## Important Notes

- **EXTRA IMPORTANT** : Tailwind CSS v4 avec `@theme` dans `globals.css` — jamais de `tailwind.config.ts` pour les couleurs ou tokens
- **EXTRA IMPORTANT** : les cinq couleurs de la charte FACAM STAIRWAY (`facamBlue`, `facamDark`, `facamYellow`, `facamWhite`, `facamBlack`) ne sont jamais modifiées — tout token additionnel est un ajout, jamais un remplacement
- Un utilisateur n'a qu'un seul rôle actif à la fois (`ADMIN` / `MANAGER` / `COLLABORATOR`) et doit toujours appartenir à un département
- Mot de passe en clair : jamais stocké, jamais loggé — ne transite que dans la requête `sendUserCredentials()` au moment de l'envoi
- Réinitialisation de mot de passe par OTP (code à 6 chiffres, 10 minutes, usage unique) — jamais de lien
- Notifications : push uniquement sur consentement explicite via le bandeau in-app, jamais la popup navigateur sans contexte ; toujours un repli sur email si refusé ou non abonné
- Les emails `otp-reset` et `credentials` sont des messages de sécurité — toujours envoyés par email, jamais par push, quel que soit le consentement notification de l'utilisateur
- Une semaine de Week Planner validée devient non modifiable — toute correction nécessite une nouvelle planification
- Un projet n'est disponible dans le Week Planner qu'une fois `isConfirmed = true` par l'Administrateur principal
- Pas d'historique détaillé des modifications sur les données validées — seule la dernière version est conservée